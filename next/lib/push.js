import webpush from "web-push";
import { getSupabase } from "./supabase";

let configured = false;

// VAPID 키가 없으면 알림 기능만 끄고 나머지는 그대로 동작
function configure() {
  if (configured) return true;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject) return false;
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
  return true;
}

// 브라우저의 PushSubscription JSON을 검사해 저장할 값으로 바꿈
export function parseSubscription(value) {
  const endpoint = value?.endpoint;
  const p256dh = value?.keys?.p256dh;
  const auth = value?.keys?.auth;
  if (
    typeof endpoint !== "string" || !endpoint.startsWith("https://") || endpoint.length > 1000 ||
    typeof p256dh !== "string" || p256dh.length > 200 ||
    typeof auth !== "string" || auth.length > 100
  ) {
    return null;
  }
  return { endpoint, p256dh, auth };
}

export async function saveSubscription(subscription) {
  const { error } = await getSupabase()
    .from("push_subscriptions")
    .upsert(subscription, { onConflict: "endpoint" });
  if (error) throw error;
}

export async function deleteSubscription(endpoint) {
  const { error } = await getSupabase().from("push_subscriptions").delete().eq("endpoint", endpoint);
  if (error) throw error;
}

function truncate(text, max) {
  const chars = [...text];
  return chars.length > max ? chars.slice(0, max).join("") + "…" : text;
}

// 새 메시지를 구독자 모두에게 알림 (보낸 사람의 기기는 뺌)
export async function notifyNewEntry(entry, senderEndpoint) {
  if (!configure()) return;
  const { data, error } = await getSupabase().from("push_subscriptions").select("endpoint, p256dh, auth");
  if (error) throw error;

  const payload = JSON.stringify({
    title: `${entry.emoji || "💌"} ${entry.name}${entry.to ? ` → ${entry.to}` : ""}`,
    body: truncate(entry.message, 80),
    tag: `entry-${entry.id}`,
    url: "/",
  });

  const targets = data.filter((row) => row.endpoint !== senderEndpoint);
  await Promise.all(
    targets.map(async (row) => {
      try {
        await webpush.sendNotification(
          { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } },
          payload,
          { TTL: 60 * 60 * 24 },
        );
      } catch (e) {
        // 만료되거나 취소된 구독은 지움
        if (e.statusCode === 404 || e.statusCode === 410) {
          await deleteSubscription(row.endpoint).catch(() => {});
        } else {
          console.error("알림 전송 실패", e.statusCode, e.body);
        }
      }
    }),
  );
}
