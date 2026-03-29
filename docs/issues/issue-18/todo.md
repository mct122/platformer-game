# Issue #18 ToDo

## Phase 1: HUD更新最適化
- [x] `_lastDisplayedTime` プロパティを `create()` に追加
- [x] `update()` の無条件 `_emitHUD()` 呼び出しを削除
- [x] タイマー秒数変化時のみ `_emitHUD()` を呼ぶよう変更
- [x] timerLow フラグ変化時の呼び出しを追加
- [x] テスト実行
