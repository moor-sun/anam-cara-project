package com.anamcara.controller;

import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.Locale;
import java.util.Map;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class PaymentController {
  private final String keyId;
  private final String keySecret;

  public PaymentController(
      @Value("${razorpay.key-id}") String keyId,
      @Value("${razorpay.key-secret}") String keySecret) {
    this.keyId = keyId;
    this.keySecret = keySecret;
  }

  @PostMapping("/api/create-order")
  public ResponseEntity<?> createOrder(@RequestBody CreateOrderRequest request) {
    if (request.amount() == null || request.amount() < 100) {
      return ResponseEntity.badRequest().body(Map.of("message", "Amount must be at least 100 paise."));
    }
    String currency = request.currency() == null ? "" : request.currency().trim().toUpperCase(Locale.ROOT);
    if (currency.length() != 3) {
      return ResponseEntity.badRequest().body(Map.of("message", "Currency must be a 3-letter code."));
    }
    if (request.receipt() == null || request.receipt().isBlank() || request.receipt().length() > 40) {
      return ResponseEntity.badRequest().body(Map.of("message", "Receipt is required and must not exceed 40 characters."));
    }
    if (!isConfigured()) {
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
          .body(Map.of("message", "Razorpay is not configured on the server."));
    }

    try {
      RazorpayClient client = new RazorpayClient(keyId, keySecret);
      JSONObject options = new JSONObject();
      options.put("amount", request.amount());
      options.put("currency", currency);
      options.put("receipt", request.receipt());
      Order order = client.orders.create(options);
      return ResponseEntity.ok(new CreateOrderResponse(
          order.get("id"), order.get("amount"), order.get("currency"), keyId));
    } catch (RazorpayException exception) {
      if (isAuthenticationFailure(exception)) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .body(Map.of("message", "Razorpay authentication failed."));
      }
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
          .body(Map.of("message", "Could not create the Razorpay order."));
    }
  }

  @PostMapping("/api/verify-payment")
  public ResponseEntity<?> verifyPayment(@RequestBody VerifyPaymentRequest request) {
    if (isBlank(request.razorpayOrderId()) || isBlank(request.razorpayPaymentId())
        || isBlank(request.razorpaySignature())) {
      return ResponseEntity.badRequest().body(Map.of("message", "All payment verification fields are required."));
    }
    if (!isConfigured()) {
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
          .body(Map.of("message", "Razorpay is not configured on the server."));
    }

    try {
      String payload = request.razorpayOrderId() + "|" + request.razorpayPaymentId();
      Mac mac = Mac.getInstance("HmacSHA256");
      mac.init(new SecretKeySpec(keySecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
      byte[] expected = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
      byte[] received = HexFormat.of().parseHex(request.razorpaySignature());
      if (!MessageDigest.isEqual(expected, received)) {
        return ResponseEntity.badRequest().body(Map.of("message", "Payment signature verification failed."));
      }
      return ResponseEntity.ok(Map.of("success", true));
    } catch (IllegalArgumentException exception) {
      return ResponseEntity.badRequest().body(Map.of("message", "Payment signature is invalid."));
    } catch (Exception exception) {
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
          .body(Map.of("message", "Could not verify the payment."));
    }
  }

  private boolean isConfigured() {
    return !isBlank(keyId) && !isBlank(keySecret)
        && !keyId.contains("xxxxx") && !"xxxxx".equals(keySecret);
  }

  private boolean isAuthenticationFailure(RazorpayException exception) {
    String message = exception.getMessage() == null ? "" : exception.getMessage().toLowerCase(Locale.ROOT);
    return message.contains("401") || message.contains("auth") || message.contains("unauthorized");
  }

  private boolean isBlank(String value) {
    return value == null || value.isBlank();
  }

  public record CreateOrderRequest(Integer amount, String currency, String receipt) {}
  public record CreateOrderResponse(String order_id, Integer amount, String currency, String key_id) {}
  public record VerifyPaymentRequest(
      String razorpay_payment_id, String razorpay_order_id, String razorpay_signature) {
    String razorpayPaymentId() { return razorpay_payment_id; }
    String razorpayOrderId() { return razorpay_order_id; }
    String razorpaySignature() { return razorpay_signature; }
  }
}
