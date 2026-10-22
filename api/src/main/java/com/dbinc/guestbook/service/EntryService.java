package com.dbinc.guestbook.service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.dbinc.guestbook.dto.EntryRequest;
import com.dbinc.guestbook.dto.EntryResponse;
import com.dbinc.guestbook.exception.ApiException;
import com.dbinc.guestbook.repository.EntryRepository;

import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@Service
public class EntryService {

  public static final int MAX_BODY_BYTES = 8192;
  private static final int LIST_LIMIT = 200;
  private static final Set<String> EMOJIS = Set.of("🎉", "🙏", "💐", "👋", "❤️", "🥂");

  private final EntryRepository entryRepository;
  private final ObjectMapper objectMapper;

  public EntryService(EntryRepository entryRepository, ObjectMapper objectMapper) {
    this.entryRepository = entryRepository;
    this.objectMapper = objectMapper;
  }

  @Transactional(readOnly = true)
  public List<EntryResponse> findLatest() {
    return entryRepository.findLatest(LIST_LIMIT);
  }

  @Transactional
  public EntryResponse create(byte[] body) {
    EntryRequest request = parse(body);
    String createdAt = Instant.now().truncatedTo(ChronoUnit.SECONDS).toString();
    long id = entryRepository.insert(request.name(), request.message(), request.to(), request.emoji(), createdAt);
    return new EntryResponse(id, request.name(), request.message(), request.to(), request.emoji(), createdAt);
  }

  // 본문 크기 → JSON 형식 → 칸별 값 순서로 검사
  private EntryRequest parse(byte[] body) {
    if (body == null || body.length == 0) {
      throw badRequest("JSON 본문이 필요합니다.");
    }
    if (body.length > MAX_BODY_BYTES) {
      throw new ApiException(HttpStatus.CONTENT_TOO_LARGE, "요청 본문이 너무 큽니다.");
    }
    JsonNode root;
    try {
      root = objectMapper.readTree(body);
    } catch (JacksonException e) {
      throw badRequest("JSON 형식을 확인해 주세요.");
    }
    if (root == null || !root.isObject()) {
      throw badRequest("JSON 객체를 보내 주세요.");
    }
    String name = requiredText(root, "name", "이름", 40);
    String message = requiredText(root, "message", "내용", 500);
    String to = optionalText(root, "to", "받는 사람", 40);
    String emoji = optionalText(root, "emoji", "이모지", 8);
    if (emoji != null && !EMOJIS.contains(emoji)) {
      throw badRequest("이모지는 🎉 🙏 💐 👋 ❤️ 🥂 중에서 골라 주세요.");
    }
    return new EntryRequest(name, message, to, emoji);
  }

  private String requiredText(JsonNode root, String key, String label, int max) {
    JsonNode node = root.get(key);
    if (node == null || !node.isString() || node.stringValue().strip().isEmpty()) {
      throw badRequest(label + "을 입력해 주세요.");
    }
    return checkLength(node.stringValue().strip(), label, max);
  }

  // 없거나 null이거나 빈 값이면 null로 저장
  private String optionalText(JsonNode root, String key, String label, int max) {
    JsonNode node = root.get(key);
    if (node == null || node.isNull()) {
      return null;
    }
    if (!node.isString()) {
      throw badRequest(label + "은 문자열로 보내 주세요.");
    }
    String value = node.stringValue().strip();
    return value.isEmpty() ? null : checkLength(value, label, max);
  }

  private String checkLength(String value, String label, int max) {
    // 이모지 같은 글자도 한 글자로 세도록 코드 포인트 기준
    if (value.codePointCount(0, value.length()) > max) {
      throw badRequest(label + "은 " + max + "자 이내로 입력해 주세요.");
    }
    return value;
  }

  private ApiException badRequest(String message) {
    return new ApiException(HttpStatus.BAD_REQUEST, message);
  }

}
