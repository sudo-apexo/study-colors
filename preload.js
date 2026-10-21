"use strict";
// The only things the page may ask the app to do. Runs before the page, with no other Node access.
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("studyDesktop", {
  // Opens the browser for Google sign-in; resolves with Google's ID token, rejects with Error(code).
  googleSignIn: (helperUrl) =>
    ipcRenderer.invoke("google-login", String(helperUrl)).then((r) => {
      if (r && r.token) return r.token;
      throw new Error((r && r.error) || "failed");
    }),
  cancelGoogleSignIn: () => ipcRenderer.invoke("google-login-cancel"),
});

// ---- One-click update row in Settings > About (added here so the page itself is unchanged) ----
ipcRenderer.invoke("update-info").catch(() => ({})).then((info) => {
  const version = (info && info.version) || "";
  window.addEventListener("DOMContentLoaded", () => {
    const about = document.getElementById("aboutLine");
    if (!about || document.getElementById("updBtn")) return;
    const msg = document.createElement("p");
    msg.className = "acct-msg";
    const wrap = document.createElement("div");
    wrap.className = "set-btns";
    const btn = document.createElement("button");
    btn.type = "button";
    btn.id = "updBtn";
    btn.className = "btn filled state";
    wrap.appendChild(btn);
    about.parentNode.insertBefore(wrap, about);
    about.parentNode.insertBefore(msg, about);
    let mode = "check";
    const v = "Version " + version + ". ";
    const set = (m, text, label, off) => {
      mode = m;
      msg.textContent = v + text;
      btn.textContent = label;
      btn.disabled = !!off;
    };
    // One tap does everything: check, download, restart.
    const run = async (auto) => {
      set("check", "Checking for updates\u2026", "Checking\u2026", true);
      const r = await ipcRenderer.invoke("update-check").catch(() => ({ error: "check" }));
      if (r.error) return set("check", "Could not reach GitHub. Check your connection and tap again.", "Check for updates");
      if (r.state === "reinstall") return set("check", "Version " + r.version + " needs a reinstall: run git pull then makepkg -si.", "Check for updates");
      if (r.state !== "available") return set("check", "You have the newest version.", "Check for updates");
      if (!auto) return set("install", "Version " + r.version + " is ready.", "Update now");
      set("install", "Downloading version " + r.version + "\u2026 the app restarts when it is done.", "Updating\u2026", true);
      const d = await ipcRenderer.invoke("update-install").catch(() => ({ error: "download" }));
      if (d && d.error === "reinstall") set("check", "This update needs a reinstall: run git pull then makepkg -si.", "Check for updates");
      else if (d && d.error) set("check", "The download failed. Tap to try again.", "Check for updates");
    };
    btn.addEventListener("click", () => run(true));
    msg.textContent = v.trim();
    run(false);
  });
});
