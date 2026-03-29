# Issue #21: 横キーを押しながらジャンプができ��い

## 問題分析
`_applyJump()` で `Phaser.Input.Keyboard.JustDown()` を使用している。
この関数は `key._justDown` フラグを参照・消費するが、複数キー同時押し時に
フレームタイミングの問題でフラグが正しく検出されない場合がある。

## 修正方針
`JustDown()` への依存を排除し、`wantsJump` プロパティ（`isDown` ベース）の
前フレームとの差分で「押した瞬間」を手動検出する。

### 詳細設計
1. `_prevJumpDown` ���ロパティを追加（前フレームのジャンプキー状態）
2. `_applyJump()` 内で `wantsJump && !_prevJumpDown` → 立ち上がりエッジ検出
3. エッジ検出またはモバイルの `_jumpJustPressed` でバッファを設定
4. `Phaser.Input.Keyboard.JustDown()` の呼び出しを完全に削除

### なぜこの方法が正しいか
- `isDown` プロパティはDOM keydownイベントで直接セットされるため信頼性が高い
- 手動エッジ検出は他キーの状態に影響されない
- coyote time / jump buffer の既存ロジックはそのまま活用

## 影響範囲
- `src/entities/Player.js` の `_applyJump()` メソッドのみ
