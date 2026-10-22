package com.dbinc.guestbook.dto;

// POST /api/entries 응답: {"entry": {...}}
public record EntryEnvelope(EntryResponse entry) {
}
