# テスト仕様書 — platformer-game

作成: ベジータ（QA） / 2026-03-14
更新: ベジータ（QA） / 2026-03-14（単体・結合・E2E 追加）

---

## テスト構成

```
tests/
├── unit/
│   ├── gamedata.test.js      ← CHARACTERS定数 / マップ定数 / インデックスアクセス
│   └── audio.test.js         ← AudioManager / BGM / SE / toggleMute
├── integration/
│   └── scene-logic.test.js   ← GameStateManager / スコア / コイン / ライフ / タイマー
└── e2e/
    └── gameplay.test.js      ← Playwright でブラウザ操作 / 画面遷移 / プレイヤー操作
```

### 実行コマンド

```bash
npm test                  # 全テスト（vitest run）
npm run test:unit         # 単体テストのみ
npm run test:integration  # 結合テストのみ
npm run test:e2e          # E2Eテスト（Vite dev server 起動後に実行）
npm run test:watch        # ウォッチモード
npm run test:coverage     # カバレッジ計測
```

### E2E テスト実行前提

```bash
# 別ターミナルで Vite dev server を起動
npm run dev
# その後
npm run test:e2e
# または URL 指定
E2E_URL=http://localhost:5173 npm run test:e2e
```

---

## 1. 単体テスト（Unit）— gamedata.test.js

### CHARACTERS 配列

| No  | テスト内容 | 期待結果 | ステータス |
|-----|-----------|---------|-----------|
| U01 | 3 キャラクター定義 | length === 3 | ✅ |
| U02 | 各キャラに必須フィールド | name, stats, tag, color あり | ✅ |
| U03 | Donko が BALANCED | tag === 'BALANCED' | ✅ |
| U04 | Poon が SPEED・最大速度 | tag === 'SPEED', speed が最大 | ✅ |
| U05 | Emanuel が JUMPER・最大ジャンプ | tag === 'JUMPER', jump が最小（最大絶対値） | ✅ |
| U06 | jump は全キャラ負の値 | stats.jump < 0 | ✅ |
| U07 | fallMulti は全キャラ 1 以上 | stats.fallMulti >= 1 | ✅ |
| U08 | speed と accel は正の値 | > 0 | ✅ |
| U09 | キャラ名はすべて一意 | Set(names).size === 3 | ✅ |
| U10 | tag はすべて一意 | Set(tags).size === 3 | ✅ |

### マップ・物理定数

| No  | テスト内容 | 期待結果 | ステータス |
|-----|-----------|---------|-----------|
| U11 | TILE_SIZE === 32 | 32 | ✅ |
| U12 | PLAYER_SIZE === 44 | 44（TILE_SIZE より大） | ✅ |
| U13 | GRAVITY は正の値 | > 0 | ✅ |
| U14 | MAP_WIDTH === 6400 | 6400 | ✅ |
| U15 | MAP_HEIGHT === 800 | 800 | ✅ |
| U16 | MAP_WIDTH >> MAP_HEIGHT（横スクロール） | MAP_WIDTH > MAP_HEIGHT * 2 | ✅ |

### インデックスアクセス

| No  | テスト内容 | 期待結果 | ステータス |
|-----|-----------|---------|-----------|
| U17 | CHARACTERS[0] === Donko | name === 'Donko' | ✅ |
| U18 | CHARACTERS[1] === Poon | name === 'Poon' | ✅ |
| U19 | CHARACTERS[2] === Emanuel | name === 'Emanuel' | ✅ |

---

## 2. 単体テスト（Unit）— audio.test.js

### コンストラクタ

| No  | テスト内容 | 期待結果 | ステータス |
|-----|-----------|---------|-----------|
| A01 | インスタンス生成 | エラーなし | ✅ |
| A02 | 初期 muted === false | false | ✅ |
| A03 | _bgmRunning === false | false | ✅ |
| A04 | _melody は 48 音符 | length === 48 | ✅ |
| A05 | _bass は 48 音符 | length === 48 | ✅ |

### toggleMute()

| No  | テスト内容 | 期待結果 | ステータス |
|-----|-----------|---------|-----------|
| A06 | 1回呼ぶと muted === true | true | ✅ |
| A07 | 2回呼ぶと muted === false | false | ✅ |
| A08 | 返り値は現在の muted 状態 | true / false 交互 | ✅ |

### startBGM() / stopBGM()

| No  | テスト内容 | 期待結果 | ステータス |
|-----|-----------|---------|-----------|
| A09 | startBGM() → _bgmRunning === true | true | ✅ |
| A10 | stopBGM() → _bgmRunning === false | false | ✅ |
| A11 | 2回 startBGM() → 重複開始しない | _bgmNote 変化なし | ✅ |
| A12 | stop 後に再 startBGM() できる | _bgmRunning === true | ✅ |

### play() SE（11種）

| No  | テスト内容 | SE名 | ステータス |
|-----|-----------|------|-----------|
| A13–A23 | 各 SE 名でエラーなく実行 | jump / stomp / coin / powerup / damage / death / block / clear / shell / combo / fall | ✅ |
| A24 | 未知の SE 名でもクラッシュしない | 'unknownSE' | ✅ |

### _tone() 内部メソッド

| No  | テスト内容 | 期待結果 | ステータス |
|-----|-----------|---------|-----------|
| A25 | freq=0 → Oscillator 生成なし（休符） | createOscillator 未呼び出し | ✅ |
| A26 | freq>0 → Oscillator が生成される | createOscillator 1回呼び出し | ✅ |

---

## 3. 結合テスト（Integration）— scene-logic.test.js

### スコア管理

| No  | テスト内容 | 期待結果 | ステータス |
|-----|-----------|---------|-----------|
| I01 | 初期スコアは 0 | score === 0 | ✅ |
| I02 | addScore(100) → 100 | score === 100 | ✅ |
| I03 | addScore 複数回 → 累積 | 100+200+500 === 800 | ✅ |
| I04 | 死亡後 addScore → 無視 | score 変化なし | ✅ |

### コイン管理

| No  | テスト内容 | 期待結果 | ステータス |
|-----|-----------|---------|-----------|
| I05 | 初期コインは 0 | coins === 0 | ✅ |
| I06 | addCoin() → コイン+1・スコア+200 | coins === 1, score === 200 | ✅ |
| I07 | addCoin() 5回 → コイン5・スコア1000 | coins === 5, score === 1000 | ✅ |

### ライフ・死亡

| No  | テスト内容 | 期待結果 | ステータス |
|-----|-----------|---------|-----------|
| I08 | 初期ライフは 3 | lives === 3 | ✅ |
| I09 | onDeath() → ライフ -1 | lives === 2 | ✅ |
| I10 | ライフ残存 → respawn イベント | {lives: 2} でイベント発火 | ✅ |
| I11 | ライフ 0 → gameOver イベント | {score} でイベント発火 | ✅ |
| I12 | 死亡後に再 onDeath() → 重複発火なし | spy が1回のみ呼ばれる | ✅ |

### タイマー

| No  | テスト内容 | 期待結果 | ステータス |
|-----|-----------|---------|-----------|
| I13 | 初期タイマーは 300 秒 | _timer === 300 | ✅ |
| I14 | tickTimer(10) → 290 秒 | _timer === 290 | ✅ |
| I15 | タイマーは 0 以下にならない | _timer === 0（not 負） | ✅ |
| I16 | タイマー 0 で timerExpired イベント | spy 呼び出し確認 | ✅ |
| I17 | 残り 100 秒でボーナス +10,000pts | timerBonus() === 10000 | ✅ |
| I18 | 残り 0 秒でボーナス 0pts | timerBonus() === 0 | ✅ |

### コンボカウンタ

| No  | テスト内容 | 期待結果 | ステータス |
|-----|-----------|---------|-----------|
| I19 | 初期コンボは 0 | _comboCount === 0 | ✅ |
| I20 | incrementCombo() で増加 | 1, 2, 3 | ✅ |
| I21 | resetCombo() で 0 に戻る | _comboCount === 0 | ✅ |

### HUD 更新イベント

| No  | テスト内容 | 期待結果 | ステータス |
|-----|-----------|---------|-----------|
| I22 | addScore() → hudUpdate イベント | {score, coins, lives, timer} | ✅ |
| I23 | addCoin() → hudUpdate イベント | {score, coins, lives, timer} | ✅ |

### シーン遷移ロジック

| No  | テスト内容 | 期待結果 | ステータス |
|-----|-----------|---------|-----------|
| I24 | gameOver 時に score が渡される | {score: 3700} | ✅ |
| I25 | タイムボーナスが最終スコアに加算 | score + timer * 100 | ✅ |
| I26 | コインスコア + タイムボーナス合算 | 3000 + 15000 = 18000 | ✅ |

---

## 4. E2E / 総合テスト — gameplay.test.js

> **注意:** Vite dev server (`npm run dev`) が起動していない場合、テストは自動的にスキップされる

| No  | テスト内容 | 操作 | 期待結果 |
|-----|-----------|------|---------|
| T01 | Vite サーバー到達・canvas 表示 | ページアクセス | canvas 要素が存在する |
| T02 | TitleScene 描画 | ページ読み込み | canvas の width/height > 0 |
| T03 | Space キー → 画面遷移 | スペース押下 | canvas が消えない（クラッシュなし） |
| T04 | キャラ選択 → ゲーム開始 | Space → Enter | canvas 継続表示 |
| P01 | 左右移動 | ← → キー | エラー発生なし |
| P02 | ジャンプ | スペース | canvas 継続表示 |
| P03 | 30秒操作でエラーなし | 複合操作 | コンソールエラー 0 件 |

---

## 5. 手動テスト（自動化対象外）

### 画面遷移テスト（目視確認）

| No  | テスト内容 | 手順 | 期待結果 |
|-----|-----------|------|---------|
| M01 | タイトル → キャラ選択 | スペース/クリック | CharSelectScene に遷移 |
| M02 | キャラ選択 → ゲーム開始 | キャラを選択 | GameScene + UIScene が起動 |
| M03 | ゲームオーバー → リスタート | 残機0でゲームオーバー後 | GameOverScene → TitleScene に戻れる |
| M04 | ステージクリア → 次へ | ゴールに到達 | StageClearScene → 次ステージ or タイトル |

### 敵テスト（目視確認）

| No  | テスト内容 | 期待結果 |
|-----|-----------|---------|
| E01 | Goomba を上から踏む | Goomba 死亡・スコア加算・SE再生 |
| E02 | Goomba に横から触れる | プレイヤーがダメージ（成長時 → 縮む、小さい時 → 死亡） |
| E03 | Koopa を踏む | 甲羅状態になる |
| E04 | 甲羅を蹴る | 甲羅が滑り始め、敵・プレイヤーに当たる |
| E05 | 連続踏みコンボ | "COMBO x2" テキスト表示・ボーナス加算 |

### BGM・SE テスト（目視・聴覚確認）

| No  | テスト内容 | 前提 | 期待結果 |
|-----|-----------|------|---------|
| A01 | ゲーム開始時にBGMが鳴る | GameScene.js の `// audio.startBGM()` を有効化 | BGM が流れる |
| A02 | ゲームオーバー・クリア時にBGM停止 | — | BGM が停止する |
| A03–A07 | SE（ジャンプ・コイン・踏みつけ・ダメージ・クリア） | 各アクション実行 | それぞれの音が鳴る |
