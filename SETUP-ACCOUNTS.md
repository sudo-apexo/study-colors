# Turn on sign-in and sync (one time, about 10 minutes)

Study Colors works without an account. These steps add **Email** and **Google** sign-in and sync your subjects between your computer and phone. It is free.

## 1. Create a Firebase project
1. Go to https://console.firebase.google.com and sign in with Google.
2. Click **Create a project**, name it `study-colors`, click Continue. Turn Google Analytics off. Click **Create project**.

## 2. Turn on the sign-in methods
1. Left menu: **Build > Authentication** > **Get started**.
2. **Email/Password**: click it, turn **Enable** on, **Save**.
3. **Google**: click it, turn **Enable** on, pick your email as support email, **Save**.

## 3. Create the database
1. Left menu: **Build > Firestore Database** > **Create database**.
2. Pick any location near you, choose **Production mode**, **Enable**.
3. Open the **Rules** tab, delete everything there, paste the contents of `firestore.rules` from this repo, click **Publish**.

## 4. Get your app settings
1. Click the gear next to **Project Overview** > **Project settings**.
2. Under **Your apps** click the **</>** (Web) icon, name it `study-colors`, click **Register app**.
3. You will see a block called `firebaseConfig`. Copy it, or paste it to Claude in chat and it will do the next step for you.
4. Keep the values **out of the repository**. They are not passwords, but there is no reason to publish them.
   - **Linux app:** create the file `~/.config/study-colors/firebase-config.json`:
     ```json
     {
       "firebase": {
         "apiKey": "...", "authDomain": "...", "projectId": "...",
         "appId": "...", "storageBucket": "...", "messagingSenderId": "..."
       },
       "helperUrl": "https://YOUR-NAME.github.io/study-colors/auth.html",
       "googleWebClientId": "...apps.googleusercontent.com"
     }
     ```
   - **Android app:** in the Android repo open **Settings > Secrets and variables > Actions > New repository secret**, name it `FIREBASE_CONFIG_JS`, and paste the text of a `firebase-config.js` file that has your real values (same shape as the `firebase-config.js` in this repo, but with `window.STUDY_FIREBASE_CONFIG = { ... }` filled in). The build writes it into the app.
   - Your data is protected by the rules from step 3, not by hiding these values. For extra safety, restrict the API key to your own apps in Google Cloud Console (APIs and Services > Credentials).

## 5. Turn on the Google sign-in page (GitHub Pages)
Google does not allow sign-in inside apps, so a small page on GitHub opens in your browser.
1. On GitHub open the `study-colors` repo > **Settings > Pages**.
2. Source: **Deploy from a branch**, branch **main**, folder **/ (root)**, **Save**.
3. In Firebase: **Authentication > Settings > Authorized domains > Add domain**: `sudo-apexo.github.io`.

## 6. Update the apps
- Computer: `cd ~/study-colors-install && git checkout -- . && git pull && makepkg -si`
- Phone: download the newest APK from the Android repo's Releases page and install it over the old one.

Use the same values for the Linux file and the Android secret.
