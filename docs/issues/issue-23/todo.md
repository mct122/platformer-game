# Issue #23 ToDo

## Phase 1: UIScene に _reconnectGame() メソッドを追加
- [ ] `_reconnectGame(gameScene)` メソッドを実装
- [ ] 旧リスナーの解除 + 新 GameScene への再登録
- [ ] `_timerFlashing` と関連 tween のリセット
- [ ] テスト実行

## Phase 2: GameScene.create() から UIScene を再接続
- [ ] create() 末尾に UIScene アクティブチェック + `_reconnectGame()` 呼び出し
- [ ] テスト実行
