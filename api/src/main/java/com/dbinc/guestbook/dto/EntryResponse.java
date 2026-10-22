package com.dbinc.guestbook.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

// 기록 하나 (created_at은 UTC ISO 문자열)
public record EntryResponse(
    long id,
    String name,
    String message,
    String to,
    String emoji,
    @JsonProperty("created_at") String createdAt
) {
}
