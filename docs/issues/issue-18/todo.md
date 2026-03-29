# Issue #18 ToDo

## Phase 1: HUD更新最適化
- [ ] `_lastDisplayedTime` プロパティを `create()` に追加
- [ ] `update()` の無条件 `_emitHUD()` 呼び出しを削除
- [ ] タイマー秒数変化時のみ `_emitHUD()` を呼ぶよう変更
- [ ] timerLow フラグ変化時の呼び出しを追加
- [ ] テスト実行
