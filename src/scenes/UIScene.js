import { audio } from '../main.js'

/** HUD + モバイルタッチコントロール + ポーズ */
export class UIScene extends Phaser.Scene {
  constructor() { super({ key: 'UIScene', active: false }) }

  create() {
    const { width, height } = this.scale
    const game = this.scene.get('GameScene')

    this._paused = false

    // --- HUD パネル（半透明バー） ---
    this.add.rectangle(width / 2, 22, width, 44, 0x000000, 0.45).setScrollFactor(0)

    const style = {
      fontFamily: 'monospace', fontSize: '15px', color: '#ffffff',
      stroke: '#000', strokeThickness: 3
    }
    this.scoreText = this.add.text(16, 12, 'SCORE  000000', style)
    this.coinText  = this.add.text(width / 2, 22, '🪙 00', style).setOrigin(0.5)
    this.livesText = this.add.text(width - 100, 12, '♥ 3', style)

    // ポーズボタン（右上）
    const pauseBtn = this.add.text(width - 16, 12, '⏸', { fontSize: '22px' })
      .setOrigin(1, 0).setInteractive({ cursor: 'pointer' })
    pauseBtn.on('pointerdown', () => this._togglePause(game))

    // サウンドトグル
    const sndBtn = this.add.text(width - 50, 12, '🔊', { fontSize: '18px' })
      .setOrigin(1, 0).setInteractive({ cursor: 'pointer' })
    sndBtn.on('pointerdown', () => {
      const m = audio.toggleMute()
      sndBtn.setText(m ? '🔇' : '🔊')
    })

    // --- キーボードポーズ (P / Escape) ---
    this.input.keyboard.on('keydown-P',      () => this._togglePause(game))
    this.input.keyboard.on('keydown-ESC',    () => this._togglePause(game))

    // --- ポーズオーバーレイ（初期は非表示） ---
    this._buildPauseOverlay(width, height, game)

    // --- モバイルタッチボタン ---
    this._setupTouchControls(width, height, game)

    // --- GameScene のイベントを購読 ---
    game.events.on('updateHUD', d => this._updateHUD(d), this)
  }

  _updateHUD({ score, coins, lives }) {
    this.scoreText.setText(`SCORE  ${String(score).padStart(6, '0')}`)
    this.coinText.setText(`🪙 ${String(coins).padStart(2, '0')}`)
    this.livesText.setText(`♥ ${lives}`)
  }

  // =====================================================
  //  ポーズ
  // =====================================================
  _buildPauseOverlay(W, H, game) {
    this._pauseGroup = this.add.group()

    const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.7)
      .setDepth(200)

    const title = this.add.text(W / 2, H / 2 - 80, 'PAUSED', {
      fontFamily: 'monospace', fontSize: '40px', color: '#ffe000',
      stroke: '#000', strokeThickness: 6
    }).setOrigin(0.5).setDepth(201)

    const resumeBtn = this._makePauseBtn(W / 2, H / 2, '▶  RESUME', () => this._togglePause(game))
    const retryBtn  = this._makePauseBtn(W / 2, H / 2 + 60, '↺  RETRY', () => {
      this._hidePause()
      this.scene.stop('UIScene')
      this.scene.stop('GameScene')
      this.scene.start('GameScene')
      this.scene.launch('UIScene')
    })
    const titleBtn  = this._makePauseBtn(W / 2, H / 2 + 120, '⌂  TITLE', () => {
      this.scene.stop('UIScene')
      this.scene.stop('GameScene')
      this.scene.start('TitleScene')
    })

    this._pauseGroup.addMultiple([overlay, title, resumeBtn, retryBtn, titleBtn])
    this._pauseGroup.setVisible(false)
  }

  _makePauseBtn(x, y, label, cb) {
    const btn = this.add.text(x, y, label, {
      fontFamily: 'monospace', fontSize: '22px', color: '#ffffff',
      backgroundColor: '#333366',
      padding: { x: 28, y: 12 },
      stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5).setInteractive({ cursor: 'pointer' }).setDepth(201)
    btn.on('pointerover',  () => btn.setStyle({ backgroundColor: '#5555aa' }))
    btn.on('pointerout',   () => btn.setStyle({ backgroundColor: '#333366' }))
    btn.on('pointerdown',  cb)
    return btn
  }

  _togglePause(game) {
    if (!game || game._dead) return
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

    // 左側: 方向ボタン（円形）
    const lx = 60, rx = 150, by = H - 55
    this._btnL = this._makeCircleBtn('◀', lx, by, 44, 0x333333)
    this._btnR = this._makeCircleBtn('▶', rx, by, 44, 0x333333)

    // 右側: ジャンプボタン（大きめ・青）
    this._btnJ = this._makeCircleBtn('▲', W - 70, by, 50, 0x224488)

    // 左ボタン
    this._bindBtn(this._btnL,
      () => { if (p()) p().touch.left  = true },
      () => { if (p()) p().touch.left  = false }
    )
    // 右ボタン
    this._bindBtn(this._btnR,
      () => { if (p()) p().touch.right = true },
      () => { if (p()) p().touch.right = false }
    )
    // ジャンプボタン
    this._bindBtn(this._btnJ,
      () => { if (p()) { p().touch.jump = true; p().triggerJump() } },
      () => { if (p()) p().touch.jump = false }
    )
  }

  _makeCircleBtn(label, x, y, r, color) {
    // 背景円
    const circle = this.add.circle(x, y, r, color, 0.55)
      .setScrollFactor(0).setDepth(100).setInteractive()
    // ラベル
    this.add.text(x, y, label, {
      fontFamily: 'monospace', fontSize: '22px', color: '#ffffff'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(101)
    return circle
  }

  _bindBtn(obj, down, up) {
    obj.on('pointerdown',   down)
    obj.on('pointerup',     up)
    obj.on('pointerout',    up)
    obj.on('pointercancel', up)
    // 押下フィードバック
    obj.on('pointerdown', () => obj.setAlpha(0.9))
    obj.on('pointerup',   () => obj.setAlpha(0.55))
    obj.on('pointerout',  () => obj.setAlpha(0.55))
  }
}
