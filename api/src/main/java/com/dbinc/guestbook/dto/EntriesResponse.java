package com.dbinc.guestbook.dto;

import java.util.List;

// GET /api/entries 응답: {"entries": [...]}
public record EntriesResponse(List<EntryResponse> entries) {
}
