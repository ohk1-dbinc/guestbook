import { getSupabase } from "./supabase";

export const MAX_BODY_BYTES = 8192;
const LIST_LIMIT = 200;
const EMOJIS = ["🎉", "🙏", "💐", "👋", "❤️", "🥂"];
const COLUMNS = "id, name, message, recipient, emoji, created_at";

// 사용자에게 보여 줄 문장과 상태 코드를 함께 담는 오류
export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// DB 행 → API 약속 모양 (created_at은 UTC ...Z 문자열)
function toEntry(row) {
  return {
    id: row.id,
    name: row.name,
    message: row.message,
    to: row.recipient,
    emoji: row.emoji,
    created_at: new Date(row.created_at).toISOString(),
  };
}

function length(value) {
  // 이모지도 한 글자로 세도록 코드 포인트 기준
  return [...value].length;
}

function requiredText(body, key, label, max) {
  const raw = body[key];
  if (typeof raw !== "string" || raw.trim() === "") {
    throw new ApiError(400, `${label}을 입력해 주세요.`);
  }
  const value = raw.trim();
  if (length(value) > max) {
    throw new ApiError(400, `${label}은 ${max}자 이내로 입력해 주세요.`);
  }
  return value;
}

// 없거나 null이거나 빈 값이면 null로 저장
function optionalText(body, key, label, max) {
  const raw = body[key];
  if (raw === undefined || raw === null) return null;
  if (typeof raw !== "string") {
    throw new ApiError(400, `${label}은 문자열로 보내 주세요.`);
  }
  const value = raw.trim();
  if (value === "") return null;
  if (length(value) > max) {
    throw new ApiError(400, `${label}은 ${max}자 이내로 입력해 주세요.`);
  }
  return value;
}

// 본문 바이트 → 검사한 입력값 (크기 → UTF-8 → JSON → 칸별 값 순서)
export function parseEntry(bytes) {
  if (bytes.byteLength === 0) {
    throw new ApiError(400, "JSON 본문이 필요합니다.");
  }
  if (bytes.byteLength > MAX_BODY_BYTES) {
    throw new ApiError(413, "요청 본문이 너무 큽니다.");
  }
  let body;
  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    body = JSON.parse(text);
  } catch {
    throw new ApiError(400, "JSON 형식을 확인해 주세요.");
  }
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    throw new ApiError(400, "JSON 객체를 보내 주세요.");
  }
  const entry = {
    name: requiredText(body, "name", "이름", 40),
    message: requiredText(body, "message", "내용", 500),
    recipient: optionalText(body, "to", "받는 사람", 40),
    emoji: optionalText(body, "emoji", "이모지", 8),
  };
  if (entry.emoji !== null && !EMOJIS.includes(entry.emoji)) {
    throw new ApiError(400, "이모지는 🎉 🙏 💐 👋 ❤️ 🥂 중에서 골라 주세요.");
  }
  return entry;
}

export async function findLatest() {
  const { data, error } = await getSupabase()
    .from("entries")
    .select(COLUMNS)
    .order("id", { ascending: false })
    .limit(LIST_LIMIT);
  if (error) throw error;
  return data.map(toEntry);
}

export async function insertEntry(entry) {
  const { data, error } = await getSupabase()
    .from("entries")
    .insert(entry)
    .select(COLUMNS)
    .single();
  if (error) throw error;
  return toEntry(data);
}
