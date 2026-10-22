package com.dbinc.guestbook.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.dbinc.guestbook.dto.EntriesResponse;
import com.dbinc.guestbook.dto.EntryEnvelope;
import com.dbinc.guestbook.dto.EntryRequest;
import com.dbinc.guestbook.service.EntryService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "방명록", description = "송별·축하 메시지")
@RestController
@RequestMapping("/api/entries")
public class EntryController {

  private final EntryService entryService;

  public EntryController(EntryService entryService) {
    this.entryService = entryService;
  }

  @Operation(summary = "목록 받기", description = "최신 글부터 최대 200개")
  @GetMapping
  public EntriesResponse list() {
    return new EntriesResponse(entryService.findLatest());
  }

  // 크기·형식·타입 검사를 직접 하려고 본문을 바이트 그대로 받음
  @Operation(summary = "메시지 남기기")
  @io.swagger.v3.oas.annotations.parameters.RequestBody(
      content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
          schema = @Schema(implementation = EntryRequest.class)))
  @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
  @ResponseStatus(HttpStatus.CREATED)
  public EntryEnvelope create(@RequestBody(required = false) byte[] body) {
    return new EntryEnvelope(entryService.create(body));
  }

}
