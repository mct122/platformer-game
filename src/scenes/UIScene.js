import { audio } from '../main.js'

/** HUD + モバイルタッチコントロール + ポーズ */
export class UIScene extends Phaser.Scene {
  constructor() { super({ key: 'UIScene', active: false }) }

  create() {
    const W = this.scale.width
    const H = this.scale.height
    const game = this.scene.get('GameScene')

    this._paused = false

    // =====================================================
    //  HUD バー（上部）
    // =====================================================
    // グラデーション風バー
    const hudBg = this.add.graphics()
    hudBg.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.8, 0.8, 0, 0)
    hudBg.fillRect(0, 0, W, 50)

    const scoreStyle = {
      fontFamily: '"Orbitron", monospace',
      fontSize: '17px',
      color: '#ffffff',
      stroke: '#000011',
      strokeThickness: 4
    }
    const labelStyle = {
      fontFamily: '"Orbitron", monospace',
      fontSize: '10px',
      color: '#aabbff',
      stroke: '#000011',
      strokeThickness: 2
    }

    // SCORE
    this.add.text(16, 6, 'SCORE', labelStyle)
    this.scoreText = this.add.text(16, 18, '000000', scoreStyle)

    // COINS（中央）
    this.add.text(W / 2, 6, 'COINS', labelStyle).setOrigin(0.5, 0)
    this.coinText = this.add.text(W / 2, 18, '🪙 00', scoreStyle).setOrigin(0.5, 0)

    // LIVES（右）
    this.add.text(W - 16, 6, 'LIVES', labelStyle).setOrigin(1, 0)
    this.livesText = this.add.text(W - 16, 18, '♥ ♥ ♥', scoreStyle).setOrigin(1, 0)

    // サウンドトグル
    this._sndBtn = this.add.text(W - 52, 6, '🔊', { fontSize: '18px' })
      .setOrigin(1, 0).setInteractive({ cursor: 'pointer' })
    this._sndBtn.on('pointerdown', () => {
      const m = audio.toggleMute()
      this._sndBtn.setText(m ? '🔇' : '🔊')
    })

    // ポーズボタン
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

  _updateHUD({ score, coins, lives }) {
    this.scoreText.setText(String(score).padStart(6, '0'))
    this.coinText.setText(`🪙 ${String(coins).padStart(2, '0')}`)
    // ライフをハートで表示（最大5まで）
    const hearts = '♥'.repeat(Math.max(0, Math.min(lives, 5)))
    const empties = '♡'.repeat(Math.max(0, 5 - Math.min(lives, 5)))
    this.livesText.setText(hearts + empties)
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

    // 背景
    const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.78).setDepth(200)

    // タイトル
    const title = this.add.text(W / 2, H / 2 - 100, 'PAUSED', {
      fontFamily: '"Orbitron", monospace',
      fontSize: '42px',
      fontStyle: 'bold',
      color: '#00d4ff',
      stroke: '#003366',
      strokeThickness: 6
    }).setOrigin(0.5).setDepth(201)

    // セパレーター
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

    // 左右ボタン（左下）
    this._btnL = this._makeCircleBtn('◀', 55,       H - 65, R, 0x1a1a4a)
    this._btnR = this._makeCircleBtn('▶', 55 + R*2 + 18, H - 65, R, 0x1a1a4a)

    // ジャンプボタン（右下・大きめ）
    this._btnJ = this._makeCircleBtn('▲', W - 65, H - 65, R + 6, 0x1a3a5a)

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
    // 外枠
    const ring = this.add.circle(x, y, r + 3, 0x4488ff, 0.3)
      .setScrollFactor(0).setDepth(100)
    // 背景
    const circle = this.add.circle(x, y, r, color, 0.7)
      .setScrollFactor(0).setDepth(101).setInteractive()
    // ラベル
    this.add.text(x, y, label, {
      fontFamily: '"Orbitron", monospace',
      fontSize: `${Math.floor(r * 0.7)}px`,
      color: '#ffffff'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(102)

    // ring も circle と同じインタラクションにするために circle を返す
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
