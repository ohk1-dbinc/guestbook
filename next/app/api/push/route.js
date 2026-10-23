import { deleteSubscription, parseSubscription, saveSubscription } from "@/lib/push";

function error(status, message) {
  return Response.json({ error: message }, { status });
}

async function readSubscription(request) {
  const contentType = (request.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
  if (contentType !== "application/json") {
    return { failure: error(415, "application/json으로 보내 주세요.") };
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return { failure: error(400, "JSON 형식을 확인해 주세요.") };
  }
  const subscription = parseSubscription(body);
  if (!subscription) return { failure: error(400, "알림 구독 정보가 올바르지 않습니다.") };
  return { subscription };
}

// 알림 켜기: 구독 저장
export async function POST(request) {
  const { subscription, failure } = await readSubscription(request);
  if (failure) return failure;
  try {
    await saveSubscription(subscription);
    return Response.json({ ok: true }, { status: 201 });
  } catch (e) {
    console.error("구독 저장 실패", e);
    return error(500, "알림을 켜지 못했습니다. 다시 시도해 주세요.");
  }
}

// 알림 끄기: 구독 삭제
export async function DELETE(request) {
  const { subscription, failure } = await readSubscription(request);
  if (failure) return failure;
  try {
    await deleteSubscription(subscription.endpoint);
    return Response.json({ ok: true });
  } catch (e) {
    console.error("구독 삭제 실패", e);
    return error(500, "알림을 끄지 못했습니다. 다시 시도해 주세요.");
  }
}
