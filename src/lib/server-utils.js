// src/lib/server-utils.js

export async function getServerTime() {
  return new Date().toISOString();
}
