import { audio } from '../main.js'
import { CHARACTERS } from '../utils/GameData.js'

/** HUD + モバイルタッチコントロール + ポーズ */
export class UIScene extends Phaser.Scene {
  constructor() { super({ key: 'UIScene', active: false }) }

  create() {
    const W = this.scale.width
    const H = this.scale.height
    const game = this.scene.get('GameScene')

    this._paused = false
    this._timerFlashing = false

    // =====================================================
    //  HUD バー（NSMB スタイル）
    // =====================================================
    // 半透明ダークバー（上部）
    const hudBg = this.add.graphics()
    hudBg.fillStyle(0x000000, 0.72)
    hudBg.fillRect(0, 0, W, 52)
    // 下端ライン
    hudBg.lineStyle(1, 0x224466, 0.6)
    hudBg.lineBetween(0, 52, W, 52)

    const labelStyle = {
      fontFamily: '"Orbitron", monospace',
      fontSize: '9px',
      color: '#7799bb',
      stroke: '#000011',
      strokeThickness: 2
    }
    const valueStyle = {
      fontFamily: '"Orbitron", monospace',
      fontSize: '19px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000011',
      strokeThickness: 4
    }

    // ─── 左ゾーン: キャラ名 + スコア ─────────────────
    const charIdx = this.registry.get('charIndex') ?? 0
    const charName = CHARACTERS[charIdx]?.name?.toUpperCase() ?? 'PLAYER'
    this.add.text(14, 5, charName, { ...labelStyle, color: '#aaddff' })
    this.scoreText = this.add.text(14, 16, '000000', { ...valueStyle, fontSize: '21px' })

    // ─── 中央ゾーン: コイン + ライフ ─────────────────
    // ★ × コイン数
    this.add.text(W / 2 - 6, 5, 'COINS', labelStyle).setOrigin(0.5, 0)
    this.coinText = this.add.text(W / 2, 16, '★ ×00', {
      ...valueStyle, fontSize: '18px', color: '#FFD700'
    }).setOrigin(0.5, 0)

    // ライフ（ハート表示）
    this.livesText = this.add.text(W / 2, 36, '♥♥♥', {
      fontFamily: '"Orbitron", monospace',
      fontSize: '13px',
      color: '#ff6677',
      stroke: '#000011',
      strokeThickness: 3
    }).setOrigin(0.5, 0)

    // ─── 右ゾーン: TIME カウントダウン ───────────────
    this.add.text(W - 14, 5, 'TIME', { ...labelStyle, color: '#aaddff' }).setOrigin(1, 0)
    this.timeText = this.add.text(W - 14, 16, '300', {
      ...valueStyle, fontSize: '23px'
    }).setOrigin(1, 0)

    // サウンドトグル（右端の TIME の左に配置）
    this._sndBtn = this.add.text(W - 96, 5, '🔊', { fontSize: '16px' })
      .setOrigin(1, 0).setInteractive({ cursor: 'pointer' })
    this._sndBtn.on('pointerdown', () => {
      const m = audio.toggleMute()
      this._sndBtn.setText(m ? '🔇' : '🔊')
    })

    // ポーズボタン（フローティング右下）
    this._buildPauseBtn(W, H, game)

    // ポーズオーバーレイ
    this._buildPauseOverlay(W, H, game)

    // タッチコントロール
    this._setupTouchControls(W, H, game)

    // キーボードポーズ
    this.input.keyboard.on('keydown-P',   () => this._togglePause(game))
    this.input.keyboard.on('keydown-ESC', () => this._togglePause(game))

    // GameSceneイベント購読
    if (game) {
      game.events.on('updateHUD', d => this._updateHUD(d), this)
      this._gameScene = game
    }
  }

  shutdown() {
    if (this._gameScene) {
      this._gameScene.events.off('updateHUD', null, this)
      this._gameScene = null
    }
  }

  /** GameScene リスタート時に HUD イベントを再接続し、状態をリセットする */
  _reconnectGame(gameScene) {
    // 旧リスナーをクリーンアップ
    if (this._gameScene) {
      this._gameScene.events.off('updateHUD', null, this)
    }
    // 新しい GameScene に再接続
    this._gameScene = gameScene
    gameScene.events.on('updateHUD', d => this._updateHUD(d), this)
    // タイマー点滅状態をリセット
    this._timerFlashing = false
    if (this.timeText) {
      this.tweens.killTweensOf(this.timeText)
      this.timeText.setColor('#ffffff').setAlpha(1)
    }
  }

  _updateHUD({ score, coins, lives, timeLeft, timerLow }) {
    // スコア
    this.scoreText.setText(String(score).padStart(6, '0'))

    // コイン
    this.coinText.setText(`★ ×${String(coins).padStart(2, '0')}`)

    // ライフ（最大5ハート）
    const hearts  = '♥'.repeat(Math.max(0, Math.min(lives, 5)))
    const empties = '♡'.repeat(Math.max(0, 5 - Math.min(lives, 5)))
    this.livesText.setText(hearts + empties)

    // タイマー
    const t = Math.max(0, timeLeft ?? 300)
    this.timeText.setText(String(t).padStart(3, '0'))

    // 残り30秒で赤く点滅
    if (timerLow && !this._timerFlashing) {
      this._timerFlashing = true
      this.timeText.setColor('#ff3333')
      this.tweens.add({
        targets: this.timeText,
        alpha: 0.25,
        duration: 400,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut'
      })
    }
  }

  // =====================================================
  //  ポーズボタン
  // =====================================================
  _buildPauseBtn(W, H, game) {
    const btn = this.add.text(W - 16, H - 16, '⏸', {
      fontFamily: '"Orbitron", monospace',
      fontSize: '20px',
      color: '#ffffff',
      backgroundColor: '#00000066',
      padding: { x: 8, y: 6 }
    }).setOrigin(1, 1).setInteractive({ cursor: 'pointer' }).setDepth(50)
    btn.on('pointerdown', () => this._togglePause(game))
  }

  // =====================================================
  //  ポーズオーバーレイ
  // =====================================================
  _buildPauseOverlay(W, H, game) {
    this._pauseGroup = this.add.group()

    const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.78).setDepth(200)

    const title = this.add.text(W / 2, H / 2 - 100, 'PAUSED', {
      fontFamily: '"Orbitron", monospace',
      fontSize: '42px',
      fontStyle: 'bold',
      color: '#00d4ff',
      stroke: '#003366',
      strokeThickness: 6
    }).setOrigin(0.5).setDepth(201)

    const sep = this.add.rectangle(W / 2, H / 2 - 58, 220, 2, 0x00d4ff, 0.5).setDepth(201)

    const resumeBtn = this._makePauseBtn(W / 2, H / 2 - 10, '▶  RESUME', 0x00aa44, () => this._togglePause(game))
    const retryBtn  = this._makePauseBtn(W / 2, H / 2 + 55, '↺  RETRY',  0x336699, () => {
      this._hidePause()
      this.scene.stop('UIScene')
      this.scene.stop('GameScene')
      this.scene.start('GameScene')
      this.scene.launch('UIScene')
    })
    const titleBtn = this._makePauseBtn(W / 2, H / 2 + 120, '⌂  TITLE', 0x663344, () => {
      this.scene.stop('UIScene')
      this.scene.stop('GameScene')
      this.scene.start('TitleScene')
    })

    this._pauseGroup.addMultiple([overlay, title, sep, resumeBtn, retryBtn, titleBtn])
    this._pauseGroup.setVisible(false)
  }

  _makePauseBtn(x, y, label, bgColor, cb) {
    const btn = this.add.text(x, y, label, {
      fontFamily: '"Orbitron", monospace',
      fontSize: '18px',
      color: '#ffffff',
      backgroundColor: `#${bgColor.toString(16).padStart(6, '0')}cc`,
      padding: { x: 32, y: 14 },
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5).setInteractive({ cursor: 'pointer' }).setDepth(201)

    btn.on('pointerover',  () => btn.setAlpha(0.85))
    btn.on('pointerout',   () => btn.setAlpha(1))
    btn.on('pointerdown',  cb)
    return btn
  }

  _togglePause(game) {
    const g = game ?? this._gameScene
    if (!g || g._dead) return
    game = g
    if (!this.scene.isActive('GameScene')) return
    this._paused = !this._paused
    if (this._paused) {
      this.scene.pause('GameScene')
      this._pauseGroup.setVisible(true)
      audio.pause()
    } else {
      this._hidePause()
    }
  }

  _hidePause() {
    this._paused = false
    this._pauseGroup.setVisible(false)
    this.scene.resume('GameScene')
    audio.resume()
  }

  // =====================================================
  //  タッチコントロール
  // =====================================================
  _setupTouchControls(W, H, game) {
    const p = () => game?.player
    const R = 36  // ボタン半径

    this._btnL = this._makeCircleBtn('◀', 55,           H - 65, R,     0x1a1a4a)
    this._btnR = this._makeCircleBtn('▶', 55 + R*2 + 18, H - 65, R,     0x1a1a4a)
    this._btnJ = this._makeCircleBtn('▲', W - 65,        H - 65, R + 6, 0x1a3a5a)

    this._bindBtn(this._btnL,
      () => { if (p()) p().touch.left  = true },
      () => { if (p()) p().touch.left  = false }
    )
    this._bindBtn(this._btnR,
      () => { if (p()) p().touch.right = true },
      () => { if (p()) p().touch.right = false }
    )
    this._bindBtn(this._btnJ,
      () => { if (p()) { p().touch.jump = true; p().triggerJump() } },
      () => { if (p()) p().touch.jump = false }
    )
  }

  _makeCircleBtn(label, x, y, r, color) {
    const ring = this.add.circle(x, y, r + 3, 0x4488ff, 0.3)
      .setScrollFactor(0).setDepth(100)
    const circle = this.add.circle(x, y, r, color, 0.7)
      .setScrollFactor(0).setDepth(101).setInteractive()
    this.add.text(x, y, label, {
      fontFamily: '"Orbitron", monospace',
      fontSize: `${Math.floor(r * 0.7)}px`,
      color: '#ffffff'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(102)

    circle._ring = ring
    return circle
  }

  _bindBtn(obj, down, up) {
    obj.on('pointerdown',   down)
    obj.on('pointerup',     up)
    obj.on('pointerout',    up)
    obj.on('pointercancel', up)
    obj.on('pointerdown', () => { obj.setAlpha(1.0); obj._ring?.setAlpha(0.8) })
    obj.on('pointerup',   () => { obj.setAlpha(0.7); obj._ring?.setAlpha(0.3) })
    obj.on('pointerout',  () => { obj.setAlpha(0.7); obj._ring?.setAlpha(0.3) })
  }
}
