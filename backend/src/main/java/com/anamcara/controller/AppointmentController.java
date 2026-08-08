package com.anamcara.controller;
import com.anamcara.model.Appointment;
import com.anamcara.repository.AppointmentRepository;
import com.anamcara.repository.SlotUnavailableException;
import com.anamcara.service.WhatsAppNotificationService;
import com.anamcara.service.EmailNotificationService;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.time.LocalTime;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {
  private final AppointmentRepository repo;
  private final WhatsAppNotificationService notifications;
  private final EmailNotificationService emailNotifications;
  public AppointmentController(AppointmentRepository repo, WhatsAppNotificationService notifications,
      EmailNotificationService emailNotifications){
    this.repo = repo;
    this.notifications = notifications;
    this.emailNotifications = emailNotifications;
  }
  @PostMapping public AppointmentCreationResponse create(@RequestBody Appointment appointment){
    validateSlot(appointment);
    if (appointment.paymentReference == null || appointment.paymentReference.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The UPI transaction ID is required.");
    }
    appointment.paymentAmount = 1000;
    Appointment saved = repo.save(appointment);
    boolean whatsAppSent = notifications.sendAppointmentCreated(saved);
    boolean emailSent = emailNotifications.sendAppointmentCreated(saved);
    return new AppointmentCreationResponse(saved, emailSent, whatsAppSent);
  }
  @GetMapping public List<Appointment> all(){ return repo.findAll(); }

  @PutMapping("/{id}/status")
  public Appointment updateStatus(@PathVariable String id, @RequestBody StatusUpdate request) {
    if (request.status() == null
        || (!request.status().equals("CONFIRMED") && !request.status().equals("REJECTED"))) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Status must be CONFIRMED or REJECTED.");
    }
    Appointment updated = repo.updateStatus(id, request.status());
    if (request.status().equals("CONFIRMED")) notifications.sendAppointmentConfirmed(updated);
    return updated;
  }

  @GetMapping("/availability")
  public List<AvailabilitySlot> availability(@RequestParam String date) {
    LocalDate selectedDate;
    try {
      selectedDate = LocalDate.parse(date);
    } catch (java.time.format.DateTimeParseException exception) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The selected date is invalid.");
    }
    List<Appointment> appointments = repo.findAll();
    LocalDateTime now = LocalDateTime.now(ZoneId.of("Asia/Kolkata"));
    List<AvailabilitySlot> slots = new ArrayList<>();
    for (LocalTime time = LocalTime.of(10, 0); !time.isAfter(LocalTime.of(18, 0)); time = time.plusMinutes(30)) {
      LocalDateTime start = LocalDateTime.of(selectedDate, time);
      boolean overlaps = appointments.stream().anyMatch(existing -> overlaps(existing, start));
      slots.add(new AvailabilitySlot(time.toString(), start.isAfter(now) && !overlaps));
    }
    return slots;
  }

  public record AppointmentCreationResponse(
      Appointment appointment, boolean emailNotificationSent, boolean whatsAppNotificationSent) {}
  public record AvailabilitySlot(String time, boolean available) {}
  public record StatusUpdate(String status) {}

  @ExceptionHandler(SlotUnavailableException.class)
  @ResponseStatus(HttpStatus.CONFLICT)
  public Map<String, String> slotUnavailable(SlotUnavailableException exception) {
    return Map.of("message", exception.getMessage());
  }

  @ExceptionHandler(IllegalStateException.class)
  @ResponseStatus(HttpStatus.CONFLICT)
  public Map<String, String> invalidStatusChange(IllegalStateException exception) {
    return Map.of("message", exception.getMessage());
  }

  private void validateSlot(Appointment appointment) {
    if (appointment.preferredDate == null || appointment.preferredDate.isBlank()
        || appointment.preferredTime == null || appointment.preferredTime.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A preferred date and time are required.");
    }
    try {
      LocalTime time = LocalTime.parse(appointment.preferredTime);
      if ((time.getMinute() != 0 && time.getMinute() != 30)
          || time.isBefore(LocalTime.of(10, 0)) || time.isAfter(LocalTime.of(18, 0))) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
            "Choose an available appointment between 10:00 and 18:00.");
      }
      LocalDateTime start = LocalDateTime.of(LocalDate.parse(appointment.preferredDate), time);
      if (!start.isAfter(LocalDateTime.now(ZoneId.of("Asia/Kolkata")))) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choose a future appointment time.");
      }
    } catch (java.time.format.DateTimeParseException exception) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The preferred time is invalid.");
    }
  }

  private boolean overlaps(Appointment existing, LocalDateTime requestedStart) {
    if ("REJECTED".equals(existing.status)) return false;
    try {
      LocalDateTime existingStart = LocalDateTime.parse(existing.preferredDate + "T" + existing.preferredTime);
      return requestedStart.isBefore(existingStart.plusMinutes(60))
          && existingStart.isBefore(requestedStart.plusMinutes(60));
    } catch (RuntimeException exception) {
      return false;
    }
  }
}
