# Issue #19: 移動中の甲羅が他の敵を倒す機能がない

## 設計概要
蹴った甲羅が他の敵(Goomba/Koopa)に当たっても何も起きない。マリオシリーズの基本メカニクスとして実装すべき。

## 修正方針
1. `GameScene._buildLevel()` で enemies グループ内の overlap を追加
2. overlap コールバックで shell_moving の Koopa が他の敵に触れた時の処理を実装
3. Goomba/Koopa に `killByShell()` メソッドを追加

### 詳細設計
- `this.physics.add.overlap(this.enemies, this.enemies, this._onEnemyEnemyOverlap, null, this)`
- コールバック内で:
  - 一方が shell_moving の Koopa かチェック
  - もう一方が生存中の敵かチェック
  - 条件を満たせば対象を `killByShell()` で倒す + スコア加算
- Goomba: `killByShell()` → 横に吹き飛ぶ演出 + 消滅
- Koopa (walking): `killByShell()` → 横に吹き飛ぶ演出 + 消滅

## 影響範囲
- `src/scenes/GameScene.js`
- `src/entities/Goomba.js`
- `src/entities/Koopa.js`
