// /api 아래 없는 주소는 JSON 404로 답함
function notFound() {
  return Response.json({ error: "찾을 수 없는 경로입니다." }, { status: 404 });
}

export const GET = notFound;
export const POST = notFound;
export const PUT = notFound;
export const PATCH = notFound;
export const DELETE = notFound;
