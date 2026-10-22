package com.dbinc.guestbook.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import com.dbinc.guestbook.dto.ErrorResponse;

// 모든 실패를 {"error": "설명"} 한 가지 모양으로 답함
@RestControllerAdvice
public class GlobalExceptionHandler {

  private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

  @ExceptionHandler(ApiException.class)
  public ResponseEntity<ErrorResponse> handleApi(ApiException e) {
    return error(e.getStatus(), e.getMessage());
  }

  @ExceptionHandler(HttpMessageNotReadableException.class)
  public ResponseEntity<ErrorResponse> handleNotReadable(HttpMessageNotReadableException e) {
    return error(HttpStatus.BAD_REQUEST, "JSON 본문이 필요합니다.");
  }

  @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
  public ResponseEntity<ErrorResponse> handleMediaType(HttpMediaTypeNotSupportedException e) {
    return error(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "application/json으로 보내 주세요.");
  }

  @ExceptionHandler(NoResourceFoundException.class)
  public ResponseEntity<ErrorResponse> handleNotFound(NoResourceFoundException e) {
    return error(HttpStatus.NOT_FOUND, "찾을 수 없는 경로입니다.");
  }

  @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
  public ResponseEntity<ErrorResponse> handleMethod(HttpRequestMethodNotSupportedException e) {
    return error(HttpStatus.METHOD_NOT_ALLOWED, "지원하지 않는 요청 방법입니다.");
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<ErrorResponse> handleUnknown(Exception e) {
    log.error("처리하지 못한 오류", e);
    return error(HttpStatus.INTERNAL_SERVER_ERROR, "서버 오류가 났습니다. 잠시 뒤 다시 시도해 주세요.");
  }

  private ResponseEntity<ErrorResponse> error(HttpStatus status, String message) {
    return ResponseEntity.status(status).body(new ErrorResponse(message));
  }

}
