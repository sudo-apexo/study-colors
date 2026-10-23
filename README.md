# Study Colors

A small desktop app for tracking study progress. Add a subject, name it, then
tap it to color it (red, green, gray and 13 more). The colors show your
progress in every subject at a glance. Material 3 design, Monocraft font.

Your subjects are saved on your computer in `~/.config/study-colors`.

> **Private settings:** the Firebase settings are not in this repository. See [docs/SETUP-ACCOUNTS.md](docs/SETUP-ACCOUNTS.md) to add them on your own computer.

## Features

- Add subjects and color each one from 16 colors to show your progress
- Overview bar and legend; click a color in the legend to filter by it
- Notes and an exam date for every subject, with a countdown on the tile
- "Updated 3 days ago" labels so you can see which subjects need review
- Search, and sort by your own order, name, exam date or needs review
- Drag tiles to reorder them (or use the Earlier / Later buttons)
- Undo and redo (Ctrl+Z, Ctrl+Shift+Z) and an Undo button after deleting
- Keyboard shortcuts: N new subject, / search, T theme, ? shows the list
- Desktop reminders for exams today and tomorrow (can be turned off)
- Light, dark or system theme
- Export and import a backup file
- Remembers the window size and position

## Install (Arch Linux)

```sh
sudo pacman -S --needed git base-devel electron
git clone https://github.com/sudo-apexo/study-colors.git
cd study-colors
makepkg -si
```

Then open "Study Colors" from your app launcher, or run `study-colors`.

Update later:

```sh
cd study-colors
git pull
makepkg -si
```

Remove:

```sh
sudo pacman -R study-colors
```

## Try it without installing

```sh
electron app
```

## Project layout

```
study-colors/
├── app/                  The desktop app (this is what gets installed)
│   ├── index.html        The whole app: page, styles, script, embedded fonts
│   ├── main.js           Electron window, zoom, one-tap updates
│   ├── preload.js        The small, safe bridge between the window and the page
│   ├── google-login.js   Google sign-in through your browser
│   ├── firebase-config.js  Reads your private Firebase settings (no secrets inside)
│   ├── study-sync.js     Email sign-in and cloud sync (built from tools/sync-src)
│   ├── icon.png          Window icon
│   └── package.json      App name, version, "shell" number
├── packaging/            Arch Linux files: launcher, .desktop entry, icon.svg
├── docs/                 SETUP-ACCOUNTS.md (Firebase, step by step)
├── firebase/             firestore.rules (who may read which data)
├── licenses/             Font license (Monocraft, SIL OFL)
├── tools/sync-src/       Source that builds study-sync.js and auth-helper.js
├── auth.html, auth-helper.js   The Google sign-in page served by GitHub Pages
├── PKGBUILD              Arch package recipe (makepkg -si)
└── LICENSE               MIT
```

## Licenses

App code: MIT (`LICENSE`). Monocraft font: SIL Open Font License 1.1 (`licenses/OFL-Monocraft.txt`).

## Accounts and sync (optional)

Sign in with email or Google to keep your subjects in sync between devices. It needs a free Firebase project: follow [docs/SETUP-ACCOUNTS.md](docs/SETUP-ACCOUNTS.md). Without it the app saves on your device only.

## Settings

Tap the gear in the top bar (or press `,`). You can change the theme (system, light, dark), accent color, font, text size, corner style and motion, turn exam reminders on or off, export or import a backup, delete all subjects, and manage your account. Appearance is saved on each device separately.

Fonts: 14 are built in (Monocraft, Inter, DM Sans, Poppins, Nunito, Fredoka, Atkinson Hyperlegible, Lora, Merriweather, Playfair Display, Caveat, JetBrains Mono, Space Mono, Press Start 2P), all under the SIL Open Font License. You can also use the system fonts, or type the name of any font installed on your device.

## Updating from inside the app

Open **Settings > About** and tap **Update now**. The app downloads the newest page files and restarts.
If the update says it "needs a reinstall", run `git pull` and `makepkg -si` once instead.

## Icons

The sun, moon and monitor theme icons are from Google Material Symbols (Rounded), Apache License 2.0.

The in-app update is now one tap: **Check for updates** checks, downloads and restarts the app by itself.
(This version changes the app's shell, so reinstall once with `git pull` and `makepkg -si`.)
