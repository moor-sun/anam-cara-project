package com.anamcara.repository;

public class SlotUnavailableException extends RuntimeException {
  public SlotUnavailableException(String message) {
    super(message);
  }
}
