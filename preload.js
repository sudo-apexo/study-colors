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
    const check = async () => {
      set("check", "Checking for updates\u2026", "Checking\u2026", true);
      const r = await ipcRenderer.invoke("update-check").catch(() => ({ error: "check" }));
      if (r.error) set("check", "Could not reach GitHub. Check your connection.", "Check for updates");
      else if (r.state === "available") set("install", "Version " + r.version + " is ready.", "Update now");
      else if (r.state === "reinstall") set("check", "Version " + r.version + " needs a reinstall: run git pull then makepkg -si.", "Check for updates");
      else set("check", "You have the newest version.", "Check for updates");
    };
    btn.addEventListener("click", async () => {
      if (mode !== "install") return check();
      set("install", "Downloading and restarting\u2026", "Updating\u2026", true);
      const r = await ipcRenderer.invoke("update-install").catch(() => ({ error: "download" }));
      if (r && r.error) set("check", "The update failed. Try again later.", "Check for updates");
    });
    msg.textContent = v.trim();
    check();
  });
});
