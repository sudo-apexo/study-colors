// Used only by auth.html. Signs in with Google in a normal browser tab and returns the Google ID token.
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";

var cfg = window.STUDY_FIREBASE_CONFIG || {};

function isConfigured() {
  var keys = ["apiKey", "authDomain", "projectId", "appId"];
  for (var i = 0; i < keys.length; i++) {
    var v = cfg[keys[i]];
    if (typeof v !== "string" || !v || v.indexOf("PASTE") === 0) return false;
  }
  return true;
}

window.StudyHelper = {
  configured: isConfigured(),
  signIn: function () {
    if (!isConfigured()) return Promise.reject({ code: "app/not-configured", message: "Accounts are not set up" });
    var app = initializeApp({ apiKey: cfg.apiKey, authDomain: cfg.authDomain, projectId: cfg.projectId, appId: cfg.appId });
    var auth = getAuth(app);
    var provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    return signInWithPopup(auth, provider).then(
      function (result) {
        var cred = GoogleAuthProvider.credentialFromResult(result);
        var token = cred && cred.idToken;
        var email = (result.user && result.user.email) || "";
        // The helper page keeps no session of its own; the app signs in with the token.
        return signOut(auth).catch(function () {}).then(function () {
          if (!token) throw { code: "app/no-token", message: "Google did not return a sign-in token" };
          return { idToken: token, email: email };
        });
      },
      function (e) { throw { code: (e && e.code) || "unknown", message: (e && e.message) || String(e) }; }
    );
  },
};
