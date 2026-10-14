# Study Colors

A small desktop app for tracking study progress. Add a subject, name it, then
tap it to color it (red, green, gray and 13 more). The colors show your
progress in every subject at a glance. Material 3 design, Monocraft font.

Your subjects are saved on your computer in `~/.config/study-colors`.

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
electron .
```

## Files

| File | Purpose |
| --- | --- |
| `index.html` | The app (page, styles, script, embedded font) |
| `main.js`, `package.json` | Electron window |
| `study-colors` | Launcher installed to `/usr/bin` |
| `study-colors.desktop` | App launcher entry |
| `icon.svg`, `icon.png` | App icon |
| `PKGBUILD` | Arch package recipe |

## Licenses

App code: MIT (`LICENSE`). Monocraft font: SIL Open Font License 1.1 (`OFL.txt`).
