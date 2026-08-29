package com.anamcara.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import java.nio.file.Path;

@Configuration
public class MediaConfig implements WebMvcConfigurer {
  private final String uploadLocation;
  public MediaConfig(@Value("${app.upload.directory:uploads}") String uploadDirectory) {
    this.uploadLocation = Path.of(uploadDirectory).toAbsolutePath().normalize().toUri().toString();
  }
  @Override public void addResourceHandlers(ResourceHandlerRegistry registry) {
    registry.addResourceHandler("/uploads/**").addResourceLocations(uploadLocation);
  }
}
