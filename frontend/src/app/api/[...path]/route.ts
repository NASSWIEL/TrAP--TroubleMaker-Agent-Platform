import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.API_BACKEND_URL ?? "http://localhost:8000";

async function handler(req: NextRequest): Promise<NextResponse> {
  const path = req.nextUrl.pathname;
  const search = req.nextUrl.search;
  const normalizedPath = path.endsWith("/") ? path : `${path}/`;
  const backendUrl = `${BACKEND}${normalizedPath}${search}`;

  const headers = new Headers(req.headers);
  headers.delete("host");

  const body =
    req.method !== "GET" && req.method !== "HEAD"
      ? await req.arrayBuffer()
      : undefined;

  const response = await fetch(backendUrl, {
    method: req.method,
    headers,
    body: body ?? null,
  });

  const responseHeaders = new Headers(response.headers);

  return new NextResponse(response.body, {
    status: response.status,
    headers: responseHeaders,
  });
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
