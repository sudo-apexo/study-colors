const { app, BrowserWindow, ipcMain, net, screen, shell } = require("electron");
const fs = require("fs");
const path = require("path");
const { startGoogleLogin, cancelGoogleLogin } = require("./google-login");

// Remember window size, position and maximized state between launches.
const zoomFile = () => path.join(app.getPath("userData"), "zoom.json");
const stateFile = () => path.join(app.getPath("userData"), "window-state.json");

function loadState() {
  try {
    const s = JSON.parse(fs.readFileSync(stateFile(), "utf8"));
    if (Number.isFinite(s.width) && Number.isFinite(s.height)) return s;
  } catch (e) {}
  return null;
}

function onScreen(s) {
  if (!Number.isFinite(s.x) || !Number.isFinite(s.y)) return false;
  return screen.getAllDisplays().some(({ workArea: a }) =>
    s.x < a.x + a.width && s.x + s.width > a.x && s.y < a.y + a.height && s.y + s.height > a.y
  );
}

function saveState(win) {
  try {
    const maximized = win.isMaximized();
    const bounds = maximized ? win.getNormalBounds() : win.getBounds();
    fs.writeFileSync(stateFile(), JSON.stringify({ ...bounds, maximized }));
  } catch (e) {}
}

// ---- One-click updates -------------------------------------------------------------------
// The page files (index.html, firebase-config.js, study-sync.js) can be replaced without
// root: new copies go in the app's own data folder and are used when they are newer than the
// installed ones. Changes to main.js / preload.js still need a reinstall ("shell" number).
const RAW = "https://raw.githubusercontent.com/sudo-apexo/study-colors/main/app/";
const API = "https://api.github.com/repos/sudo-apexo/study-colors/";
const PAGE_FILES = ["index.html", "firebase-config.js", "study-sync.js"];
const updateDir = () => path.join(app.getPath("userData"), "app-update");
const bundled = require("./package.json");
const BUNDLED_SHELL = Number(bundled.shell) || 1;

function newer(a, b) {
  const x = String(a).split(".").map(Number), y = String(b).split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0);
  }
  return false;
}

function hotVersion() {
  try {
    const v = JSON.parse(fs.readFileSync(path.join(updateDir(), "version.json"), "utf8"));
    if (typeof v.version !== "string" || !/^\d+\.\d+\.\d+$/.test(v.version)) return null;
    if (!PAGE_FILES.every((f) => fs.statSync(path.join(updateDir(), f)).size > 1000)) return null;
    return v.version;
  } catch (e) {
    return null;
  }
}

// Folder the page is loaded from: the downloaded update if it is newer, else the installed copy.
function pageDir() {
  const hot = hotVersion();
  return hot && newer(hot, bundled.version) ? updateDir() : __dirname;
}

function currentVersion() {
  const hot = hotVersion();
  return hot && newer(hot, bundled.version) ? hot : bundled.version;
}

// raw.githubusercontent.com keeps files for about 5 minutes, so a plain fetch can show an old version
// right after a release. Asking GitHub for the newest commit first and then fetching files by that
// commit id always gives the current files. If that lookup fails, fall back to the plain address.
let headSha = null;
async function getText(url, headers) {
  let last;
  for (let attempt = 0; attempt < 3; attempt++) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 15000);
    try {
      const res = await net.fetch(url, { cache: "no-store", signal: ctl.signal, headers: headers || {} });
      if (!res.ok) throw new Error("http " + res.status);
      return await res.text();
    } catch (e) {
      last = e;
      await new Promise((r) => setTimeout(r, 600));
    } finally {
      clearTimeout(timer);
    }
  }
  throw last || new Error("failed");
}
async function refreshHead() {
  headSha = null;
  try {
    const j = JSON.parse(await getText(API + "commits/main?t=" + Date.now(), { Accept: "application/vnd.github+json" }));
    if (/^[0-9a-f]{40}$/.test(j.sha)) headSha = j.sha;
  } catch (e) {}
}
async function fetchText(file) {
  const base = headSha ? "https://raw.githubusercontent.com/sudo-apexo/study-colors/" + headSha + "/app/" : RAW;
  return getText(base + file + "?t=" + Date.now());
}

let pendingInfo = null;

// Firebase settings live in a file on this computer instead of in the public repository.
ipcMain.on("local-config", (event) => {
  let out = null;
  try {
    // Only this app's own page is ever loaded in the window (other addresses are blocked), so the sender is trusted.
    const c = JSON.parse(fs.readFileSync(path.join(app.getPath("userData"), "firebase-config.json"), "utf8"));
    if (c && c.firebase && typeof c.firebase.apiKey === "string") out = c;
  } catch (e) {}
  event.returnValue = out;   // must be set exactly once
});
ipcMain.handle("update-info", () => ({ version: currentVersion() }));

ipcMain.handle("update-check", async (event) => {
  if (!((event.senderFrame && event.senderFrame.url) || "").startsWith("file://")) return { error: "not-allowed" };
  try {
    await refreshHead();
    const remote = JSON.parse(await fetchText("package.json"));
    if (!/^\d+\.\d+\.\d+$/.test(remote.version)) throw new Error("bad version");
    const current = currentVersion();
    pendingInfo = remote;
    if (Number(remote.shell || 1) > BUNDLED_SHELL) {
      return { state: "reinstall", version: remote.version, current };
    }
    return { state: newer(remote.version, current) ? "available" : "current", version: remote.version, current };
  } catch (e) {
    return { error: "check" };
  }
});

ipcMain.handle("update-install", async (event) => {
  if (!((event.senderFrame && event.senderFrame.url) || "").startsWith("file://")) return { error: "not-allowed" };
  try {
    if (!pendingInfo) pendingInfo = JSON.parse(await fetchText("package.json"));
    if (Number(pendingInfo.shell || 1) > BUNDLED_SHELL) return { error: "reinstall" };
    const staging = updateDir() + ".new";
    fs.rmSync(staging, { recursive: true, force: true });
    fs.mkdirSync(staging, { recursive: true });
    for (const f of PAGE_FILES) {
      const text = await fetchText(f);
      if (text.length < 1000) throw new Error("too small");
      if (f === "index.html" && !text.includes("Study Colors")) throw new Error("not the app page");
      fs.writeFileSync(path.join(staging, f), text);
    }
    fs.writeFileSync(path.join(staging, "version.json"), JSON.stringify({ version: pendingInfo.version }));
    fs.rmSync(updateDir(), { recursive: true, force: true });
    fs.renameSync(staging, updateDir());
    setTimeout(() => {
      app.relaunch();
      app.exit(0);
    }, 400);
    return { ok: true };
  } catch (e) {
    return { error: "download" };
  }
});

function createWindow() {
  const saved = loadState();
  const options = {
    width: saved ? Math.max(360, saved.width) : 1000,
    height: saved ? Math.max(520, saved.height) : 760,
    minWidth: 360,
    minHeight: 520,
    title: "Study Colors",
    icon: path.join(__dirname, "icon.png"),
    backgroundColor: "#11140F",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  };
  if (saved && onScreen(saved)) {
    options.x = saved.x;
    options.y = saved.y;
  }

  const win = new BrowserWindow(options);
  if (saved && saved.maximized) win.maximize();

  win.setMenuBarVisibility(false);
  win.loadFile(path.join(pageDir(), "index.html"));
  win.on("close", () => saveState(win));

  // Zoom with Ctrl +, Ctrl -, Ctrl 0 and Ctrl + mouse wheel. The level is remembered.
  const wc = win.webContents;
  const setZoom = (level) => {
    const z = Math.max(-3, Math.min(5, Math.round(level * 2) / 2));
    wc.setZoomLevel(z);
    try {
      fs.writeFileSync(zoomFile(), JSON.stringify({ level: z }));
    } catch (e) {}
  };
  wc.on("did-finish-load", () => {
    try {
      const z = JSON.parse(fs.readFileSync(zoomFile(), "utf8")).level;
      if (Number.isFinite(z)) wc.setZoomLevel(Math.max(-3, Math.min(5, z)));
    } catch (e) {}
  });
  wc.on("before-input-event", (event, input) => {
    if (input.type !== "keyDown" || !(input.control || input.meta) || input.alt) return;
    const k = input.key;
    if (k === "+" || k === "=" || k === "Add") {
      setZoom(wc.getZoomLevel() + 0.5);
    } else if (k === "-" || k === "_" || k === "Subtract") {
      setZoom(wc.getZoomLevel() - 0.5);
    } else if (k === "0") {
      setZoom(0);
    } else {
      return;
    }
    event.preventDefault();
  });
  wc.on("zoom-changed", (event, direction) => {
    setZoom(wc.getZoomLevel() + (direction === "in" ? 0.5 : -0.5));
  });

  // Keep the app on its own page; open any web link in the normal browser.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/i.test(url)) shell.openExternal(url);
    return { action: "deny" };
  });
  win.webContents.on("will-navigate", (event, url) => {
    if (!url.startsWith("file://")) event.preventDefault();
  });
}

// Google sign-in: only our own page (a local file) may ask for it.
ipcMain.handle("google-login", async (event, helperUrl) => {
  const from = (event.senderFrame && event.senderFrame.url) || "";
  if (!from.startsWith("file://")) return { error: "not-allowed" };
  try {
    const token = await startGoogleLogin({ openExternal: (u) => shell.openExternal(u), helperUrl });
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
      if (win.isMinimized()) win.restore();
      win.show();
      win.focus();
    }
    return { token };
  } catch (e) {
    return { error: (e && e.message) || "failed" };
  }
});
ipcMain.handle("google-login-cancel", () => {
  cancelGoogleLogin("cancelled");
});

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    const [win] = BrowserWindow.getAllWindows();
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });
  app.whenReady().then(createWindow);
  app.on("window-all-closed", () => app.quit());
}
