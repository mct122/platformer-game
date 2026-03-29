# Issue #16: QuestionBlockのactiveプロパティがPhaser組み込みプロパティと衝突

## 設計概要
`QuestionBlock` クラスで独自の状態管理に `this.active` を使用しているが、これは `Phaser.GameObjects.GameObject.active` と衝突する。`active = false` にすると Phaser がオブジェクトを非アクティブ扱いし、物理コリジョンから除外される。

## 修正方針
- `this.active` → `this._hasContent` にリネーム
- `_draw()` メソッド内の参照も更新
- `hitFromBelow()` 内の参照も更新

## 影響範囲
- `src/objects/QuestionBlock.js` のみ

## リスク
- 低: プロパティ名変更のみの軽微な修正
