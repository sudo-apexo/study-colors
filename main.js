const { app, BrowserWindow, screen, shell } = require("electron");
const fs = require("fs");
const path = require("path");

// Remember window size, position and maximized state between launches.
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
  win.loadFile(path.join(__dirname, "index.html"));
  win.on("close", () => saveState(win));

  // Keep the app on its own page; open any web link in the normal browser.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/i.test(url)) shell.openExternal(url);
    return { action: "deny" };
  });
  win.webContents.on("will-navigate", (event, url) => {
    if (!url.startsWith("file://")) event.preventDefault();
  });
}

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
