# Maintainer: sudo-apexo <you@example.com>
pkgname=study-colors
pkgver=1.16.11
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
  install -m644 package.json main.js preload.js google-login.js index.html firebase-config.js study-sync.js icon.png "$pkgdir/usr/lib/$pkgname/"

  install -Dm755 study-colors "$pkgdir/usr/bin/study-colors"
  install -Dm644 study-colors.desktop "$pkgdir/usr/share/applications/study-colors.desktop"
  install -Dm644 icon.svg "$pkgdir/usr/share/icons/hicolor/scalable/apps/study-colors.svg"
  install -Dm644 icon.png "$pkgdir/usr/share/icons/hicolor/512x512/apps/study-colors.png"

  install -Dm644 LICENSE "$pkgdir/usr/share/licenses/$pkgname/LICENSE"
  install -Dm644 OFL.txt "$pkgdir/usr/share/licenses/$pkgname/OFL-Monocraft.txt"
}
