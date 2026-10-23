const MAX_MESSAGE_LENGTH = 6000;
const MAX_REQUEST_BYTES = 26000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function respond(status, data) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
  });
}

export async function onRequest({ request, env }) {
  if (request.method !== "POST") return respond(405, { ok: false, code: "METHOD_NOT_ALLOWED" });
  const origin = request.headers.get("Origin");
  if (origin !== new URL(request.url).origin) return respond(403, { ok: false, code: "ORIGIN_REJECTED" });
  if (!request.headers.get("Content-Type")?.toLowerCase().startsWith("application/json")) {
    return respond(415, { ok: false, code: "JSON_REQUIRED" });
  }
  // Bound streamed input as well as Content-Length before parsing it.
  const reader = request.body?.getReader();
  if (!reader) return respond(400, { ok: false, code: "EMPTY_MESSAGE" });
  let bytes = 0;
  const chunks = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > MAX_REQUEST_BYTES) {
      await reader.cancel();
      return respond(413, { ok: false, code: "MESSAGE_TOO_LONG" });
    }
    chunks.push(value);
  }
  let data;
  try {
    const buffer = new Uint8Array(bytes);
    let offset = 0;
    for (const chunk of chunks) { buffer.set(chunk, offset); offset += chunk.length; }
    data = JSON.parse(new TextDecoder().decode(buffer));
  } catch {
    return respond(400, { ok: false, code: "INVALID_JSON" });
  }
  if (!data || typeof data !== "object" || Array.isArray(data) ||
      Object.keys(data).some((key) => key !== "message" && key !== "submissionId")) {
    return respond(400, { ok: false, code: "INVALID_PAYLOAD" });
  }
  const message = typeof data.message === "string" ? data.message.trim() : "";
  if (!message) return respond(400, { ok: false, code: "EMPTY_MESSAGE" });
  if (message.length > MAX_MESSAGE_LENGTH) return respond(413, { ok: false, code: "MESSAGE_TOO_LONG" });
  if (typeof data.submissionId !== "string" || !UUID.test(data.submissionId)) {
    return respond(400, { ok: false, code: "INVALID_SUBMISSION_ID" });
  }
  if (!env.FEEDBACK_DB) return respond(503, { ok: false, code: "RECEIVER_NOT_CONFIGURED" });
  try {
    // An opaque per-message ID prevents duplicates on retry; no person/device ID.
    // The global cap is atomic and does not record IP addresses or fingerprints.
    await env.FEEDBACK_DB.prepare(`
      INSERT INTO messages (id, body, created_at)
      SELECT ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
      WHERE (SELECT COUNT(*) FROM messages
        WHERE created_at >= strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-1 minute')) < 30
      ON CONFLICT(id) DO NOTHING
    `).bind(data.submissionId, message).run();
    const saved = await env.FEEDBACK_DB.prepare("SELECT body FROM messages WHERE id = ?")
      .bind(data.submissionId).first();
    if (!saved) return respond(429, { ok: false, code: "PLEASE_RETRY_LATER" });
    if (saved.body !== message) return respond(409, { ok: false, code: "SUBMISSION_CONFLICT" });
    return respond(200, { ok: true, receipt: data.submissionId });
  } catch {
    // Never log the message or include database errors in a public response.
    return respond(503, { ok: false, code: "TEMPORARILY_UNAVAILABLE" });
  }
}
