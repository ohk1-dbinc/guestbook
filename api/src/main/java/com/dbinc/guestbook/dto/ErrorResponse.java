package com.dbinc.guestbook.dto;

// 실패 응답: {"error": "설명"}
public record ErrorResponse(String error) {
}
