// Local acceptance helper only. Not copied into dist, not a Pages Function.
import http from "node:http";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
const run = promisify(execFile);
const port = 4188;
const escape = (value) => String(value).replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
}[char]));
http.createServer(async (request, response) => {
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("Content-Security-Policy", "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'; form-action 'none'");
  if (!["127.0.0.1:4188", "localhost:4188"].includes(request.headers.host) ||
      (request.headers["sec-fetch-site"] === "cross-site" && request.headers["sec-fetch-mode"] !== "navigate")) {
    response.writeHead(403); response.end("Forbidden"); return;
  }
  if (request.method !== "GET" || request.url !== "/") {
    response.writeHead(404); response.end("Not found"); return;
  }
  try {
    const { stdout } = await run(process.execPath, [
      "node_modules/wrangler/bin/wrangler.js", "d1", "execute", "yinyuan-messages", "--local", "--json",
      "--command", "SELECT body, created_at FROM messages ORDER BY created_at DESC LIMIT 100",
    ], { timeout: 20000, env: { ...process.env, WRANGLER_SEND_METRICS: "false" } });
    const rows = JSON.parse(stdout)[0].results;
    response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    response.end(`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>隐园 · 本机口信收件箱</title>
      <style>body{margin:0;background:#15251d;color:#ede9d9;font:16px/1.9 "Microsoft YaHei",sans-serif}main{max-width:720px;margin:60px auto;padding:0 24px}h1{font:32px/1.5 "Songti SC",serif;font-weight:400}.hint,time{color:#b8bcae;font-size:14px}a{color:#d3c59f}article{padding:24px 0;border-top:1px solid #ffffff24}article p{white-space:pre-wrap;overflow-wrap:anywhere}header{margin-bottom:32px}</style>
      <main><header><h1>口信收件箱</h1><p class="hint">仅此电脑的测试口信 · 刷新后查看新口信</p><p class="hint">线上口信在 Cloudflare 私有后台查看，这里不读取线上数据。</p><a href="http://127.0.0.1:4187/">回到隐园本地体验 →</a></header>
      ${rows.length ? rows.map(row => `<article><time>${escape(new Date(row.created_at).toLocaleString("zh-CN", {timeZone:"Asia/Shanghai"}))}</time><p>${escape(row.body)}</p></article>`).join("") : "<p>还没有收到测试口信。</p>"}</main></html>`);
  } catch {
    response.writeHead(503, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("暂时无法读取本机口信，请确认数据库已初始化，再刷新。");
  }
}).listen(port, "127.0.0.1", () => console.log(`Local inbox: http://127.0.0.1:${port}`));
