# Issue #23: 死亡リスタート後にHUDが更新されなくなる

## 問題の詳細
GameScene が `scene.restart()` でリスタートすると、Phaser の内部処理で
`GameScene.events.removeAllListeners()` が呼ばれる。

UIScene は `create()` 時に `game.events.on('updateHUD', ...)` で
GameScene のイベントを購読しているが、GameScene のリスタートで
このリスナーが削除される。UIScene 自体はリスタートしないため再登録されない。

```
【正常フロー（初回）】
UIScene.create() → game.events.on('updateHUD', handler)
GameScene._emitHUD() → 'updateHUD' emit → UIScene._updateHUD() ← 受信OK

【バグフロー（死亡リスタート後）】
GameScene.scene.restart()
  → GameScene.shutdown() → events.removeAllListeners() ← UISceneのリスナー消失
  → GameScene.create() → _emitHUD() → 'updateHUD' emit → 誰も受信しない ← BUG
```

## 修正方針
GameScene の `create()` 末尾で、UIScene がアクティブであれば再接続する。
UIScene 側にも `resetHUD()` メソッドを追加し、状態（`_timerFlashing` 等）をリセットする。

### GameScene.create() に追加:
```javascript
// UIScene が既にアクティブな場合（リスタート時）、HUDイベントを再接続
const ui = this.scene.get('UIScene')
if (ui && this.scene.isActive('UIScene')) {
  ui._reconnectGame(this)
}
```

### UIScene に `_reconnectGame()` メソッドを追加:
```javascript
_reconnectGame(gameScene) {
  // 旧リスナーをクリーンアップ
  if (this._gameScene) {
    this._gameScene.events.off('updateHUD', null, this)
  }
  // 新しい GameScene に再接続
  this._gameScene = gameScene
  gameScene.events.on('updateHUD', d => this._updateHUD(d), this)
  // 状態リセット
  this._timerFlashing = false
  this.timeText?.setColor('#ffffff').setAlpha(1)
  this.tweens.killTweensOf(this.timeText)
}
```

## 対象ファイル
- `src/scenes/GameScene.js` — create() 末尾に UIScene 再接続処理を追加
- `src/scenes/UIScene.js` — `_reconnectGame()` メソッド追加、状態リセット
