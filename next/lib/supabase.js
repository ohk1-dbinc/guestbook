import { createClient } from "@supabase/supabase-js";

let client;

// 서버에서만 쓰는 Supabase 클라이언트 (비밀 키는 브라우저로 나가지 않음)
export function getSupabase() {
  if (!client) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SECRET_KEY;
    if (!url || !key) {
      throw new Error("SUPABASE_URL, SUPABASE_SECRET_KEY 환경 변수가 필요합니다.");
    }
    client = createClient(url, key, { auth: { persistSession: false } });
  }
  return client;
}
