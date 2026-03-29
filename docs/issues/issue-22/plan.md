# Issue #22: 地面・足場の物理ボディがR-treeに正しく登録されない

## 問題の詳細
現行コードの操作順序:
```
physics.add.staticImage(x, y, 'tile_ground')  // 32x32テクスチャで body 作成 → R-tree挿入
img.setDisplaySize(w, h)                       // 表示サイズ変更（bodyに影響なし）
img.body.setSize(w, h)                         // R-tree除去 → サイズ変更 → 【誤った位置で】R-tree再挿入
img.refreshBody()                              // R-tree除去 → 位置修正 → R-tree再挿入
this.ground.add(img)                           // R-tree重複挿入
```

`body.setSize()` がR-treeに再挿入する時点で body.position はまだ32x32テクスチャの
getTopLeft()ベース。正しい位置に更新されるのは refreshBody() の後。
R-treeのノード構造上、この不整合により空間検索でヒットしない場合がある。

## 修正方針
全メソッドを以下のパターンに統一:
```
const img = group.create(x, y, texture)        // グループ内で body 作成
img.setVisible(false)
img.setDisplaySize(w, h)                       // 表示サイズ変更
img.refreshBody()                              // customSize=false → displaySize からサイズ導出 + 位置更新
```

`setSize()` を一切呼ばないため、R-treeの不整合が発生しない。
`refreshBody()` が `customSize=false` 時に displayWidth/Height を使ってサイズ・位置を一括更新。

## 対象メソッド
- `_buildGroundSegment()`: 地面セグメント
- `_addPlatform()`: 浮き足場
- `_addPipe()`: パイプ
