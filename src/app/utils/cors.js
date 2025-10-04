import { NextResponse } from "next/server";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Origin, Content-Type, Authorization, x-api-key",
  "Access-Control-Allow-Credentials": "true",
};

// Preflight
export function handleOptions() {
  return new Response(null, { status: 200, headers: corsHeaders });
}

// Attach headers to any response
export function withCors(response) {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}
