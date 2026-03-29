# Issue #20: PWAアイコンファイルが未配置でインストール不可

## 設計概要
`vite.config.js` の PWA manifest で参照されている `pwa-192x192.png` と `pwa-512x512.png` が `public/` に存在しない。

## 修正方針
`_legacy/public/` から現在の `public/` にPWAアイコンファイルをコピーする。

## 影響範囲
- `public/pwa-192x192.png` (新規)
- `public/pwa-512x512.png` (新規)
