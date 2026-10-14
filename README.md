# Study Colors

A small desktop app for tracking study progress. Add a subject, name it, then
tap it to color it (red, green, gray and 13 more). The colors show your
progress in every subject at a glance. Material 3 design, Monocraft font.

Your subjects are saved on your computer in `~/.config/study-colors`.

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
