package com.anamcara.service;

import com.anamcara.model.Appointment;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;

@Service
public class WhatsAppNotificationService {
  private static final Logger log = LoggerFactory.getLogger(WhatsAppNotificationService.class);

  private final RestClient restClient = RestClient.create();
  private final boolean enabled;
  private final String apiVersion;
  private final String phoneNumberId;
  private final String accessToken;
  private final String adminPhone;
  private final String templateName;
  private final String confirmationTemplateName;
  private final String templateLanguage;

  public WhatsAppNotificationService(
      @Value("${app.whatsapp.enabled}") boolean enabled,
      @Value("${app.whatsapp.api-version}") String apiVersion,
      @Value("${app.whatsapp.phone-number-id}") String phoneNumberId,
      @Value("${app.whatsapp.access-token}") String accessToken,
      @Value("${app.whatsapp.admin-phone}") String adminPhone,
      @Value("${app.whatsapp.template-name}") String templateName,
      @Value("${app.whatsapp.confirmation-template-name}") String confirmationTemplateName,
      @Value("${app.whatsapp.template-language}") String templateLanguage) {
    this.enabled = enabled;
    this.apiVersion = apiVersion;
    this.phoneNumberId = phoneNumberId;
    this.accessToken = accessToken;
    this.adminPhone = adminPhone;
    this.templateName = templateName;
    this.confirmationTemplateName = confirmationTemplateName;
    this.templateLanguage = templateLanguage;

    if (enabled && (!StringUtils.hasText(phoneNumberId) || !StringUtils.hasText(accessToken)
        || !StringUtils.hasText(adminPhone))) {
      throw new IllegalStateException(
          "WhatsApp is enabled but WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_ACCESS_TOKEN, or WHATSAPP_ADMIN_PHONE is missing");
    }
  }

  public boolean sendAppointmentConfirmed(Appointment appointment) {
    if (!enabled) {
      log.warn("Appointment {} customer confirmation is disabled", appointment.id);
      return false;
    }
    String customerPhone = normalizePhone(appointment.phone);
    if (!StringUtils.hasText(customerPhone)) {
      log.warn("Appointment {} has no valid customer phone for WhatsApp confirmation", appointment.id);
      return false;
    }
    Map<String, Object> template = Map.of(
        "name", confirmationTemplateName,
        "language", Map.of("code", templateLanguage),
        "components", List.of(Map.of(
            "type", "body",
            "parameters", List.of(
                text(appointment.name),
                text(appointment.service),
                text(appointment.preferredDate),
                text(appointment.preferredTime),
                text(appointment.appointmentMode)))));
    return sendTemplate(appointment, customerPhone, template, "customer confirmation");
  }

  public boolean sendAppointmentCreated(Appointment appointment) {
    if (!enabled) {
      log.warn("Appointment {} WhatsApp notification is disabled", appointment.id);
      return false;
    }

    Map<String, Object> template = Map.of(
        "name", templateName,
        "language", Map.of("code", templateLanguage),
        "components", List.of(Map.of(
            "type", "body",
            "parameters", List.of(
                text(appointment.name),
                text(appointment.service),
                text(appointment.preferredDate),
                text(appointment.preferredTime),
                text(appointment.phone)))));
    Map<String, Object> payload = Map.of(
        "messaging_product", "whatsapp",
        "to", adminPhone,
        "type", "template",
        "template", template);

    try {
      restClient.post()
          .uri("https://graph.facebook.com/{version}/{phoneNumberId}/messages", apiVersion, phoneNumberId)
          .headers(headers -> headers.setBearerAuth(accessToken))
          .body(payload)
          .retrieve()
          .toBodilessEntity();
      return true;
    } catch (RuntimeException exception) {
      log.error("Appointment {} was saved, but its WhatsApp notification failed", appointment.id, exception);
      return false;
    }
  }

  private Map<String, String> text(String value) {
    return Map.of("type", "text", "text", value == null || value.isBlank() ? "Not provided" : value);
  }

  private boolean sendTemplate(Appointment appointment, String to, Map<String, Object> template, String purpose) {
    Map<String, Object> payload = Map.of(
        "messaging_product", "whatsapp", "to", to, "type", "template", "template", template);
    try {
      restClient.post()
          .uri("https://graph.facebook.com/{version}/{phoneNumberId}/messages", apiVersion, phoneNumberId)
          .headers(headers -> headers.setBearerAuth(accessToken))
          .body(payload).retrieve().toBodilessEntity();
      return true;
    } catch (RuntimeException exception) {
      log.error("Appointment {} WhatsApp {} failed", appointment.id, purpose, exception);
      return false;
    }
  }

  private String normalizePhone(String phone) {
    if (!StringUtils.hasText(phone)) return "";
    String digits = phone.replaceAll("\\D", "");
    if (digits.length() == 11 && digits.startsWith("0")) digits = digits.substring(1);
    if (digits.length() == 10) digits = "91" + digits;
    return digits.length() >= 11 && digits.length() <= 15 ? digits : "";
  }
}
