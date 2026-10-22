package com.dbinc.guestbook.exception;

import org.springframework.http.HttpStatus;

// 상태 코드와 사용자에게 보여 줄 문장을 함께 담는 예외
public class ApiException extends RuntimeException {

  private final HttpStatus status;

  public ApiException(HttpStatus status, String message) {
    super(message);
    this.status = status;
  }

  public HttpStatus getStatus() {
    return status;
  }

}
