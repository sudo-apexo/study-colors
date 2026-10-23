# Maintainer: sudo-apexo <you@example.com>
pkgname=study-colors
pkgver=1.18.1
pkgrel=1
pkgdesc='Color your subjects to see your study progress'
arch=('any')
url='https://github.com/sudo-apexo/study-colors'
license=('MIT')
depends=('electron')
source=()

package() {
  cd "$startdir"

  install -dm755 "$pkgdir/usr/lib/$pkgname"
  install -m644 app/package.json app/main.js app/preload.js app/google-login.js app/index.html app/firebase-config.js app/study-sync.js app/icon.png "$pkgdir/usr/lib/$pkgname/"

  install -Dm755 packaging/study-colors "$pkgdir/usr/bin/study-colors"
  install -Dm644 packaging/study-colors.desktop "$pkgdir/usr/share/applications/study-colors.desktop"
  install -Dm644 packaging/icon.svg "$pkgdir/usr/share/icons/hicolor/scalable/apps/study-colors.svg"
  install -Dm644 app/icon.png "$pkgdir/usr/share/icons/hicolor/512x512/apps/study-colors.png"

  install -Dm644 LICENSE "$pkgdir/usr/share/licenses/$pkgname/LICENSE"
  install -Dm644 licenses/OFL-Monocraft.txt "$pkgdir/usr/share/licenses/$pkgname/OFL-Monocraft.txt"
}
