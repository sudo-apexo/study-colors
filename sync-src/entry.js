// The only file that talks to Firebase from inside the app.
// It exposes a small, promise-based API as window.StudySync; index.html does the rest.
import { initializeApp } from "firebase/app";
import {
  initializeAuth,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  inMemoryPersistence,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithCredential,
  GoogleAuthProvider,
  signOut,
} from "firebase/auth";
import { initializeFirestore, persistentLocalCache, doc, setDoc, onSnapshot } from "firebase/firestore";

var cfg = window.STUDY_FIREBASE_CONFIG || {};
var REQUIRED = ["apiKey", "authDomain", "projectId", "appId"];

function isConfigured() {
  for (var i = 0; i < REQUIRED.length; i++) {
    var v = cfg[REQUIRED[i]];
    if (typeof v !== "string" || !v || v.indexOf("PASTE") === 0) return false;
  }
  return true;
}

function normalize(e) {
  return { code: (e && e.code) || "unknown", message: (e && e.message) || String(e) };
}

function publicUser(u) {
  if (!u) return null;
  return { uid: u.uid, email: u.email || "", name: u.displayName || "", photo: u.photoURL || "" };
}

var api = { configured: false, initError: null, version: 1 };
var auth = null;
var db = null;

if (isConfigured()) {
  try {
    var app = initializeApp({
      apiKey: cfg.apiKey,
      authDomain: cfg.authDomain,
      projectId: cfg.projectId,
      appId: cfg.appId,
      storageBucket: cfg.storageBucket || undefined,
      messagingSenderId: cfg.messagingSenderId || undefined,
    });
    // No popup/redirect resolver on purpose: Google sign-in happens in the system browser.
    auth = initializeAuth(app, {
      persistence: [indexedDBLocalPersistence, browserLocalPersistence, inMemoryPersistence],
    });
    var opts = { experimentalAutoDetectLongPolling: true };
    if (typeof indexedDB !== "undefined") opts.localCache = persistentLocalCache();
    db = initializeFirestore(app, opts);
    api.configured = true;
  } catch (e) {
    api.initError = normalize(e).message;
  }
}

function need() {
  if (!api.configured) return Promise.reject({ code: "app/not-configured", message: "Accounts are not set up" });
  return null;
}

api.onAuthChange = function (cb) {
  if (!api.configured) { setTimeout(function () { cb(null); }, 0); return function () {}; }
  return onAuthStateChanged(auth, function (u) { cb(publicUser(u)); }, function () { cb(null); });
};

api.signIn = function (email, password) {
  return need() || signInWithEmailAndPassword(auth, email, password).then(function (r) { return publicUser(r.user); }, function (e) { throw normalize(e); });
};

api.signUp = function (email, password) {
  return need() || createUserWithEmailAndPassword(auth, email, password).then(function (r) { return publicUser(r.user); }, function (e) { throw normalize(e); });
};

api.resetPassword = function (email) {
  return need() || sendPasswordResetEmail(auth, email).then(function () {}, function (e) { throw normalize(e); });
};

api.signInWithGoogleIdToken = function (idToken) {
  return need() || signInWithCredential(auth, GoogleAuthProvider.credential(idToken)).then(function (r) { return publicUser(r.user); }, function (e) { throw normalize(e); });
};

api.signOut = function () {
  return need() || signOut(auth).then(function () {}, function (e) { throw normalize(e); });
};

// One document per person: users/<uid>. Calls onData for every change, including our own writes.
api.subscribe = function (uid, onData, onError) {
  if (!api.configured) return function () {};
  return onSnapshot(
    doc(db, "users", uid),
    { includeMetadataChanges: true },
    function (snap) {
      onData({
        exists: snap.exists(),
        data: snap.exists() ? snap.data() : null,
        fromCache: !!snap.metadata.fromCache,
        pending: !!snap.metadata.hasPendingWrites,
      });
    },
    function (e) { onError(normalize(e)); }
  );
};

api.write = function (uid, data) {
  return need() || setDoc(doc(db, "users", uid), JSON.parse(JSON.stringify(data))).then(function () {}, function (e) { throw normalize(e); });
};

window.StudySync = api;
