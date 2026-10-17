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
