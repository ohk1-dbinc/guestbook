package com.dbinc.guestbook.repository;

import java.util.List;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import com.dbinc.guestbook.dto.EntryResponse;

// entries 테이블 읽기·쓰기 (JdbcTemplate만 사용)
@Repository
public class EntryRepository {

  private static final RowMapper<EntryResponse> ROW_MAPPER = (rs, rowNum) -> new EntryResponse(
      rs.getLong("id"),
      rs.getString("name"),
      rs.getString("message"),
      rs.getString("recipient"),
      rs.getString("emoji"),
      rs.getString("created_at"));

  private final JdbcTemplate jdbcTemplate;

  public EntryRepository(JdbcTemplate jdbcTemplate) {
    this.jdbcTemplate = jdbcTemplate;
  }

  public List<EntryResponse> findLatest(int limit) {
    return jdbcTemplate.query(
        "SELECT id, name, message, recipient, emoji, created_at FROM entries ORDER BY id DESC LIMIT ?",
        ROW_MAPPER, limit);
  }

  // 저장하고 새 id를 돌려줌
  public long insert(String name, String message, String recipient, String emoji, String createdAt) {
    Long id = jdbcTemplate.queryForObject(
        "INSERT INTO entries(name, message, recipient, emoji, created_at) VALUES (?, ?, ?, ?, ?) RETURNING id",
        Long.class, name, message, recipient, emoji, createdAt);
    if (id == null) {
      throw new IllegalStateException("저장한 기록의 id를 받지 못했습니다.");
    }
    return id;
  }

}
