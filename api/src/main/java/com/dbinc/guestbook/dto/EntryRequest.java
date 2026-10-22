package com.dbinc.guestbook.dto;

import io.swagger.v3.oas.annotations.media.Schema;

// POST /api/entries 요청 본문 (앞뒤 공백을 지운 값)
public record EntryRequest(
    @Schema(description = "보내는 사람, 1~40자", example = "김철수", requiredMode = Schema.RequiredMode.REQUIRED)
    String name,
    @Schema(description = "메시지, 1~500자", example = "그동안 정말 고마웠어요!", requiredMode = Schema.RequiredMode.REQUIRED)
    String message,
    @Schema(description = "받는 사람(선택), 40자까지", example = "이영희")
    String to,
    @Schema(description = "이모지(선택)", example = "💐", allowableValues = {"🎉", "🙏", "💐", "👋", "❤️", "🥂"})
    String emoji
) {
}
