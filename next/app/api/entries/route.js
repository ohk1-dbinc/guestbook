import { after, connection } from "next/server";
import { ApiError, MAX_BODY_BYTES, findLatest, insertEntry, parseEntry } from "@/lib/entries";
import { notifyNewEntry } from "@/lib/push";

function error(status, message) {
  return Response.json({ error: message }, { status });
}

export async function GET() {
  // 빌드 때 미리 만들지 말고 요청마다 DB를 읽음
  await connection();
  try {
    return Response.json({ entries: await findLatest() });
  } catch (e) {
    console.error("목록 조회 실패", e);
    return error(500, "목록을 불러오지 못했습니다.");
  }
}

export async function POST(request) {
  const contentType = (request.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
  if (contentType !== "application/json") {
    return error(415, "application/json으로 보내 주세요.");
  }
  // 본문을 다 읽기 전에 선언된 길이로 먼저 거름
  if (Number(request.headers.get("content-length") || 0) > MAX_BODY_BYTES) {
    return error(413, "요청 본문이 너무 큽니다.");
  }
  try {
    const entry = await insertEntry(parseEntry(new Uint8Array(await request.arrayBuffer())));
    // 응답을 보낸 뒤 알림 전송 (실패해도 저장은 성공)
    const senderEndpoint = request.headers.get("x-push-endpoint");
    after(() => notifyNewEntry(entry, senderEndpoint).catch((e) => console.error("알림 처리 실패", e)));
    return Response.json({ entry }, { status: 201 });
  } catch (e) {
    if (e instanceof ApiError) return error(e.status, e.message);
    console.error("저장 실패", e);
    return error(500, "저장하지 못했습니다. 다시 시도해 주세요.");
  }
}
