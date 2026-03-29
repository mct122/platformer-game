# Issue #23 ToDo

## Phase 1: UIScene に _reconnectGame() メソッドを追加
- [x] `_reconnectGame(gameScene)` メソッドを実装
- [x] 旧リスナーの解除 + 新 GameScene への再登録
- [x] `_timerFlashing` と関連 tween のリセット
- [x] テスト実行

## Phase 2: GameScene.create() から UIScene を再接続
- [x] create() 末尾に UIScene アクティブチェック + `_reconnectGame()` 呼び出し
- [x] テスト実行
