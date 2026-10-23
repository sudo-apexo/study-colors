// Your Firebase settings are NOT stored in this repository.
//
//  - Linux app: they are read from a small file on your computer,
//        ~/.config/study-colors/firebase-config.json
//    (see SETUP-ACCOUNTS.md for the exact content). The app hands them to this file.
//  - Android app: the build on GitHub writes this file from a GitHub secret (SETUP-ACCOUNTS.md).
//
// Until then these placeholders keep sign-in switched off and the app works on this device only.
(function () {
  var L = window.studyLocalConfig || {};
  window.STUDY_FIREBASE_CONFIG = L.firebase || {
    apiKey: "PASTE_API_KEY",
    authDomain: "PASTE_AUTH_DOMAIN",
    projectId: "PASTE_PROJECT_ID",
    appId: "PASTE_APP_ID",
    storageBucket: "PASTE_STORAGE_BUCKET",
    messagingSenderId: "PASTE_SENDER_ID"
  };
  // The page that handles "Continue with Google" (GitHub Pages). It is not secret.
  window.STUDY_AUTH_HELPER_URL = L.helperUrl || "https://sudo-apexo.github.io/study-colors/auth.html";
  // Android only: the "Web client ID" (looks like 123-abc.apps.googleusercontent.com).
  window.STUDY_GOOGLE_WEB_CLIENT_ID = L.googleWebClientId || "";
})();
