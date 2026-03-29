# Issue #17: 甲羅キック直後にプレイヤーが自分でダメージを受ける

## 設計概要
静止甲羅を蹴った直後、次フレームで移動甲羅との overlap が発火しプレイヤーがダメージを受ける。

## 修正方針
Koopa に `_kickCooldown` タイマーを追加。キック直後は一定時間プレイヤーへのダメージ判定をスキップする。

### 詳細設計
1. `Koopa` クラスに `_kickCooldown` プロパティを追加（初期値: 0）
2. `kickShell()` で `_kickCooldown = 0.3`（0.3秒）を設定
3. `update()` で `_kickCooldown` をデクリメント
4. `touchPlayer()` で `_kickCooldown > 0` の場合は `takeDamage()` をスキップ

## 影響範囲
- `src/entities/Koopa.js`
