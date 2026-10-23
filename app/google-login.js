"use strict";
// Google sign-in for the desktop app.
// Google does not allow sign-in inside an app window, so the app opens the system browser on
// the helper page (auth.html). When you finish there, the browser sends the sign-in token back to
// a tiny listener on this computer only (127.0.0.1, random port, one use, checked with a secret).
const http = require("http");
const crypto = require("crypto");

let active = null;

function cancelGoogleLogin(reason) {
  if (active) active.cancel(reason || "cancelled");
}

const DONE_PAGE =
  "<!doctype html><html><head><meta charset=\"utf-8\"><title>Study Colors</title>" +
  "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">" +
  "<style>body{font-family:ui-monospace,Menlo,Consolas,monospace;background:#11140F;color:#E1E4DB;" +
  "display:grid;place-items:center;min-height:100vh;margin:0;padding:16px}" +
  "main{max-width:420px;background:#1D211B;border-radius:24px;padding:28px 24px;line-height:1.6}" +
  "h1{font-size:20px;margin:0 0 8px}p{margin:0;color:#C2C9BD}</style></head><body><main>" +
  "<h1>Signed in</h1><p>You can close this tab and go back to Study Colors.</p></main>" +
  "<script>history.replaceState(null,'','/done')</script></body></html>";

function startGoogleLogin(options) {
  const openExternal = options.openExternal;
  const helperUrl = options.helperUrl;
  const timeoutMs = options.timeoutMs || 5 * 60 * 1000;

  cancelGoogleLogin("cancelled");

  return new Promise((resolve, reject) => {
    let helper;
    try {
      helper = new URL(helperUrl);
    } catch (e) {
      reject(new Error("bad-helper-url"));
      return;
    }
    if (helper.protocol !== "https:") {
      reject(new Error("bad-helper-url"));
      return;
    }

    const secret = crypto.randomBytes(24).toString("hex");
    const secretBuf = Buffer.from(secret);
    let settled = false;
    let timer = null;
    let port = 0;

    const server = http.createServer((req, res) => {
      const fail = (code) => {
        res.writeHead(code, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" });
        res.end("Invalid request");
      };
      if (req.method !== "GET") return fail(405);
      // Refuse requests that did not address us as 127.0.0.1:<port> (protects against DNS rebinding).
      if (req.headers.host !== "127.0.0.1:" + port) return fail(400);

      let u;
      try {
        u = new URL(req.url, "http://127.0.0.1");
      } catch (e) {
        return fail(400);
      }
      if (u.pathname !== "/callback") return fail(404);

      const gotBuf = Buffer.from(u.searchParams.get("state") || "");
      if (gotBuf.length !== secretBuf.length || !crypto.timingSafeEqual(gotBuf, secretBuf)) return fail(400);

      const token = u.searchParams.get("token") || "";
      if (token.length > 8192 || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token)) return fail(400);

      res.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "Referrer-Policy": "no-referrer",
        "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'",
      });
      res.end(DONE_PAGE, () => finish(null, token));
    });

    function finish(err, token) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (active && active.server === server) active = null;
      try {
        server.close();
        if (typeof server.closeAllConnections === "function") server.closeAllConnections();
      } catch (e) {}
      if (err) reject(err);
      else resolve(token);
    }

    active = { server, cancel: (reason) => finish(new Error(reason)) };

    server.on("error", () => finish(new Error("listen-failed")));
    server.listen(0, "127.0.0.1", () => {
      port = server.address().port;
      helper.searchParams.set("platform", "desktop");
      helper.searchParams.set("port", String(port));
      helper.searchParams.set("state", secret);
      timer = setTimeout(() => finish(new Error("timeout")), timeoutMs);
      Promise.resolve()
        .then(() => openExternal(helper.toString()))
        .catch(() => finish(new Error("open-failed")));
    });
  });
}

module.exports = { startGoogleLogin, cancelGoogleLogin };
