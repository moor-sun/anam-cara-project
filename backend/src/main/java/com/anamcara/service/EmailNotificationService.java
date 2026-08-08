package com.anamcara.service;

import com.anamcara.model.Appointment;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailNotificationService {
  private static final Logger log = LoggerFactory.getLogger(EmailNotificationService.class);

  private final JavaMailSender mailSender;
  private final boolean enabled;
  private final String from;
  private final String recipient;

  public EmailNotificationService(
      JavaMailSender mailSender,
      @Value("${app.email.enabled}") boolean enabled,
      @Value("${spring.mail.username:}") String from,
      @Value("${app.email.appointment-recipient}") String recipient) {
    this.mailSender = mailSender;
    this.enabled = enabled;
    this.from = from;
    this.recipient = recipient;
  }

  public boolean sendAppointmentCreated(Appointment appointment) {
    if (!enabled) {
      log.warn("Appointment {} email notification is disabled", appointment.id);
      return false;
    }

    SimpleMailMessage message = new SimpleMailMessage();
    message.setFrom(from);
    message.setTo(recipient);
    if (appointment.email != null && !appointment.email.isBlank()) {
      message.setReplyTo(appointment.email);
    }
    message.setSubject("New appointment request - " + value(appointment.name));
    message.setText("""
        A new appointment request has been submitted.

        Name: %s
        Phone: %s
        Email: %s
        Service: %s
        Appointment type: %s
        Preferred date: %s
        Preferred time: %s
        Payment method: %s
        Payment amount: ₹%d
        UPI transaction ID: %s
        Payment verification: Razorpay signature verified before submission
        Message: %s
        """.formatted(
            value(appointment.name), value(appointment.phone), value(appointment.email),
            value(appointment.service), value(appointment.appointmentMode), value(appointment.preferredDate),
            value(appointment.preferredTime), value(appointment.paymentMethod),
            appointment.paymentAmount, value(appointment.paymentReference), value(appointment.message)));

    try {
      mailSender.send(message);
      return true;
    } catch (RuntimeException exception) {
      log.error("Appointment {} was saved, but its email notification failed", appointment.id, exception);
      return false;
    }
  }

  private String value(String value) {
    return value == null || value.isBlank() ? "Not provided" : value;
  }
}
