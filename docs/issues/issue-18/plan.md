# Issue #18: HUDが毎フレーム更新されパフォーマンスが低下する

## 設計概要
`GameScene.update()` で毎フレーム `_emitHUD()` を呼んでおり、不要なイベント発火とテキスト更新が発生。

## 修正方針
1. `update()` からの毎フレーム `_emitHUD()` 呼び出しを削除
2. タイマー表示の更新は1秒間隔に変更（`_lastDisplayedTime` で変化を検出）
3. スコア・コイン・ライフは変更時のみ更新（既に各イベントハンドラで呼んでいるので追加不要）

### 詳細設計
- `_lastDisplayedTime` プロパティを追加（前回表示した秒数）
- update() 内でタイマーの表示秒数が変わった場合のみ `_emitHUD()` を呼ぶ
- timerLow フラグが立った瞬間も `_emitHUD()` を呼ぶ

## 影響範囲
- `src/scenes/GameScene.js`
