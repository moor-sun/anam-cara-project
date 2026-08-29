package com.anamcara.repository;

import com.anamcara.model.SiteContent;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;
import software.amazon.awssdk.services.dynamodb.model.PutItemRequest;
import software.amazon.awssdk.services.dynamodb.model.ScanRequest;
import java.time.Instant;
import java.util.*;

@Repository
public class SiteContentRepository {
  private final DynamoDbClient dynamoDb;
  private final String tableName;
  public SiteContentRepository(@Value("${aws.region}") String region, @Value("${app.dynamodb.table}") String tableName) {
    this.tableName = tableName;
    this.dynamoDb = DynamoDbClient.builder().region(Region.of(region)).build();
  }
  public SiteContent save(SiteContent content) {
    content.id = UUID.randomUUID().toString();
    content.createdAt = Instant.now().toString();
    Map<String, AttributeValue> item = new HashMap<>();
    item.put("id", value(content.id)); item.put("recordType", value("SITE_CONTENT"));
    item.put("contentType", value(content.contentType)); item.put("mediaType", value(content.mediaType));
    item.put("mediaUrl", value(content.mediaUrl)); item.put("title", value(content.title));
    item.put("testimonial", value(content.testimonial)); item.put("name", value(content.name));
    item.put("company", value(content.company)); item.put("createdAt", value(content.createdAt));
    dynamoDb.putItem(PutItemRequest.builder().tableName(tableName).item(item).build());
    return content;
  }
  public List<SiteContent> findAll() {
    List<SiteContent> result = new ArrayList<>();
    dynamoDb.scan(ScanRequest.builder().tableName(tableName).build()).items().stream()
        .filter(item -> "SITE_CONTENT".equals(text(item, "recordType"))).forEach(item -> result.add(fromMap(item)));
    result.sort((left, right) -> right.createdAt.compareTo(left.createdAt));
    return result;
  }
  private SiteContent fromMap(Map<String, AttributeValue> item) {
    SiteContent content = new SiteContent();
    content.id=text(item,"id"); content.contentType=text(item,"contentType"); content.mediaType=text(item,"mediaType");
    content.mediaUrl=text(item,"mediaUrl"); content.title=text(item,"title"); content.testimonial=text(item,"testimonial");
    content.name=text(item,"name"); content.company=text(item,"company"); content.createdAt=text(item,"createdAt");
    return content;
  }
  private AttributeValue value(String value) { return AttributeValue.builder().s(value == null ? "" : value).build(); }
  private String text(Map<String, AttributeValue> item, String key) { return item.containsKey(key) ? item.get(key).s() : ""; }
}
