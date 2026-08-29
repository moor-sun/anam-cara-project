package com.anamcara.repository;
import com.anamcara.model.Appointment;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.*;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.DateTimeException;
import java.util.*;

@Repository
public class AppointmentRepository {
  private final DynamoDbClient dynamoDb;
  private final String tableName;
  public AppointmentRepository(@Value("${aws.region}") String region, @Value("${app.dynamodb.table}") String tableName) {
    this.tableName = tableName;
    this.dynamoDb = DynamoDbClient.builder().region(Region.of(region)).build();
  }
  public Appointment save(Appointment a) {
    LocalDateTime requestedStart = LocalDateTime.parse(a.preferredDate + "T" + a.preferredTime);
    boolean alreadyBooked = findAll().stream().anyMatch(existing -> overlaps(existing, requestedStart));
    if (alreadyBooked) {
      throw new SlotUnavailableException("This appointment time has already been booked.");
    }
    a.id = UUID.randomUUID().toString();
    a.status = "PAYMENT_PENDING";
    a.createdAt = Instant.now().toString();
    Map<String, AttributeValue> item = new HashMap<>();
    item.put("id", s(a.id)); item.put("recordType", s("APPOINTMENT")); item.put("name", s(a.name)); item.put("phone", s(a.phone)); item.put("email", s(a.email));
    item.put("service", s(a.service)); item.put("appointmentMode", s(a.appointmentMode));
    item.put("preferredDate", s(a.preferredDate)); item.put("preferredTime", s(a.preferredTime));
    item.put("paymentMethod", s(a.paymentMethod)); item.put("paymentAmount", n(a.paymentAmount)); item.put("paymentReference", s(a.paymentReference));
    item.put("message", s(a.message)); item.put("status", s(a.status)); item.put("createdAt", s(a.createdAt));
    List<TransactWriteItem> writes = new ArrayList<>();
    for (int minute = 0; minute < 60; minute++) {
      LocalDateTime reservedMinute = requestedStart.plusMinutes(minute);
      String slotId = "SLOT#" + reservedMinute.toLocalDate() + "#" + reservedMinute.toLocalTime();
      Map<String, AttributeValue> slot = new HashMap<>();
      slot.put("id", s(slotId));
      slot.put("recordType", s("SLOT"));
      slot.put("appointmentId", s(a.id));
      slot.put("createdAt", s(a.createdAt));
      writes.add(TransactWriteItem.builder().put(Put.builder()
          .tableName(tableName).item(slot).conditionExpression("attribute_not_exists(id)").build()).build());
    }
    writes.add(TransactWriteItem.builder().put(Put.builder().tableName(tableName).item(item).build()).build());
    try {
      dynamoDb.transactWriteItems(TransactWriteItemsRequest.builder().transactItems(writes).build());
    } catch (TransactionCanceledException exception) {
      throw new SlotUnavailableException("This appointment time has already been booked.");
    }
    return a;
  }
  public Appointment update(String id, Appointment changes) {
    Appointment existing = findAll().stream().filter(a -> id.equals(a.id)).findFirst()
        .orElseThrow(() -> new NoSuchElementException("Appointment not found."));
    LocalDateTime newStart = LocalDateTime.parse(changes.preferredDate + "T" + changes.preferredTime);
    boolean alreadyBooked = findAll().stream().filter(a -> !id.equals(a.id)).anyMatch(a -> overlaps(a, newStart));
    if (alreadyBooked) throw new SlotUnavailableException("This appointment time has already been booked.");
    changes.id=existing.id; changes.createdAt=existing.createdAt; changes.status=existing.status;
    if(changes.paymentMethod==null||changes.paymentMethod.isBlank())changes.paymentMethod=existing.paymentMethod;
    if(changes.paymentReference==null||changes.paymentReference.isBlank())changes.paymentReference=existing.paymentReference;
    List<TransactWriteItem> writes=new ArrayList<>();
    if(!"REJECTED".equals(changes.status))for(int minute=0;minute<60;minute++){
      LocalDateTime point=newStart.plusMinutes(minute); Map<String,AttributeValue> slot=new HashMap<>();
      slot.put("id",s("SLOT#"+point.toLocalDate()+"#"+point.toLocalTime())); slot.put("recordType",s("SLOT")); slot.put("appointmentId",s(id)); slot.put("createdAt",s(existing.createdAt));
      writes.add(TransactWriteItem.builder().put(Put.builder().tableName(tableName).item(slot).conditionExpression("attribute_not_exists(id) OR appointmentId = :appointmentId").expressionAttributeValues(Map.of(":appointmentId",s(id))).build()).build());
    }
    Map<String,AttributeValue> item=new HashMap<>();
    item.put("id",s(id));item.put("recordType",s("APPOINTMENT"));item.put("name",s(changes.name));item.put("phone",s(changes.phone));item.put("email",s(changes.email));item.put("service",s(changes.service));item.put("appointmentMode",s(changes.appointmentMode));item.put("preferredDate",s(changes.preferredDate));item.put("preferredTime",s(changes.preferredTime));item.put("paymentMethod",s(changes.paymentMethod));item.put("paymentAmount",n(changes.paymentAmount));item.put("paymentReference",s(changes.paymentReference));item.put("message",s(changes.message));item.put("status",s(changes.status));item.put("createdAt",s(changes.createdAt));
    writes.add(TransactWriteItem.builder().put(Put.builder().tableName(tableName).item(item).conditionExpression("attribute_exists(id)").build()).build());
    try{dynamoDb.transactWriteItems(TransactWriteItemsRequest.builder().transactItems(writes).build());}catch(TransactionCanceledException e){throw new SlotUnavailableException("This appointment time has already been booked.");}
    if(!"REJECTED".equals(existing.status))try{
      LocalDateTime oldStart=LocalDateTime.parse(existing.preferredDate+"T"+existing.preferredTime);
      List<TransactWriteItem> deletes=new ArrayList<>();
      for(int minute=0;minute<60;minute++){
        LocalDateTime point=oldStart.plusMinutes(minute);
        if(!point.isBefore(newStart)&&point.isBefore(newStart.plusMinutes(60)))continue;
        deletes.add(TransactWriteItem.builder().delete(Delete.builder().tableName(tableName).key(Map.of("id",s("SLOT#"+point.toLocalDate()+"#"+point.toLocalTime()))).conditionExpression("attribute_not_exists(id) OR appointmentId = :appointmentId").expressionAttributeValues(Map.of(":appointmentId",s(id))).build()).build());
      }
      for(int from=0;from<deletes.size();from+=25){int to=Math.min(from+25,deletes.size());dynamoDb.transactWriteItems(TransactWriteItemsRequest.builder().transactItems(deletes.subList(from,to)).build());}
    }catch(DateTimeException ignored){}    return changes;
  }  public List<Appointment> findAll() {
    ScanResponse response = dynamoDb.scan(ScanRequest.builder().tableName(tableName).build());
    List<Appointment> list = new ArrayList<>();
    for (Map<String, AttributeValue> m : response.items()) {
      String recordType = v(m, "recordType");
      if (recordType.isBlank() || recordType.equals("APPOINTMENT")) list.add(fromMap(m));
    }
    return list;
  }
  public Appointment updateStatus(String id, String status) {
    Appointment appointment = findAll().stream()
        .filter(existing -> id.equals(existing.id)).findFirst()
        .orElseThrow(() -> new NoSuchElementException("Appointment not found."));
    if (!appointment.status.equals("PAYMENT_PENDING") && !appointment.status.equals("NEW")) {
      throw new IllegalStateException("Only a payment-pending appointment can be confirmed or rejected.");
    }
    Map<String, AttributeValue> key = Map.of("id", s(id));
    if ("REJECTED".equals(status)) {
      LocalDateTime start = LocalDateTime.parse(appointment.preferredDate + "T" + appointment.preferredTime);
      List<TransactWriteItem> writes = new ArrayList<>();
      writes.add(TransactWriteItem.builder().update(Update.builder()
          .tableName(tableName).key(key).updateExpression("SET #status = :status")
          .expressionAttributeNames(Map.of("#status", "status"))
          .expressionAttributeValues(Map.of(":status", s(status)))
          .conditionExpression("attribute_exists(id)").build()).build());
      for (int minute = 0; minute < 60; minute++) {
        LocalDateTime reservedMinute = start.plusMinutes(minute);
        String slotId = "SLOT#" + reservedMinute.toLocalDate() + "#" + reservedMinute.toLocalTime();
        writes.add(TransactWriteItem.builder().delete(Delete.builder()
            .tableName(tableName).key(Map.of("id", s(slotId)))
            .conditionExpression("attribute_not_exists(id) OR appointmentId = :appointmentId")
            .expressionAttributeValues(Map.of(":appointmentId", s(id))).build()).build());
      }
      dynamoDb.transactWriteItems(TransactWriteItemsRequest.builder().transactItems(writes).build());
    } else {
      dynamoDb.updateItem(UpdateItemRequest.builder().tableName(tableName).key(key)
          .updateExpression("SET #status = :status")
          .expressionAttributeNames(Map.of("#status", "status"))
          .expressionAttributeValues(Map.of(":status", s(status)))
          .conditionExpression("attribute_exists(id)").build());
    }
    appointment.status = status;
    return appointment;
  }
  private AttributeValue s(String v){ return AttributeValue.builder().s(v == null ? "" : v).build(); }
  private AttributeValue n(int v){ return AttributeValue.builder().n(Integer.toString(v)).build(); }
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
  private Appointment fromMap(Map<String, AttributeValue> m){
    Appointment a = new Appointment();
    a.id=v(m,"id"); a.name=v(m,"name"); a.phone=v(m,"phone"); a.email=v(m,"email"); a.service=v(m,"service");
    a.appointmentMode=v(m,"appointmentMode"); a.preferredDate=v(m,"preferredDate"); a.preferredTime=v(m,"preferredTime");
    a.paymentMethod=v(m,"paymentMethod"); a.paymentAmount=number(m,"paymentAmount",1000); a.paymentReference=v(m,"paymentReference");
    a.message=v(m,"message"); a.status=v(m,"status"); a.createdAt=v(m,"createdAt");
    return a;
  }
  private String v(Map<String, AttributeValue> m,String k){ return m.containsKey(k)?m.get(k).s():""; }
  private int number(Map<String, AttributeValue> m, String k, int fallback) {
    try { return m.containsKey(k) ? Integer.parseInt(m.get(k).n()) : fallback; }
    catch (RuntimeException exception) { return fallback; }
  }
}
