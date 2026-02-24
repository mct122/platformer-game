import { audio } from '../main.js'

/** HUD + モバイルタッチコントロール */
export class UIScene extends Phaser.Scene {
  constructor() { super({ key: 'UIScene', active: false }) }

  create() {
    const { width, height } = this.scale
    const game = this.scene.get('GameScene')

    // --- HUD ---
    const style = { fontFamily: 'monospace', fontSize: '16px', color: '#ffffff', stroke: '#000', strokeThickness: 3 }
    this.scoreText = this.add.text(16, 12, 'SCORE  000000', style)
    this.coinText  = this.add.text(width / 2, 12, '🪙 × 00', style).setOrigin(0.5, 0)
    this.livesText = this.add.text(width - 16, 12, '× 3', style).setOrigin(1, 0)

    // サウンドトグル
    const sndBtn = this.add.text(width - 16, height - 30, '🔊', { fontSize: '20px' })
      .setOrigin(1, 1).setInteractive({ cursor: 'pointer' })
    sndBtn.on('pointerdown', () => {
      const m = audio.toggleMute()
      sndBtn.setText(m ? '🔇' : '🔊')
    })

    // --- モバイルタッチボタン ---
    this._setupTouchControls(width, height, game)

    // --- GameScene のイベントを購読 ---
    game.events.on('updateHUD', d => this._updateHUD(d), this)
  }

  _updateHUD({ score, coins, lives }) {
    this.scoreText.setText(`SCORE  ${String(score).padStart(6, '0')}`)
    this.coinText.setText(`🪙 × ${String(coins).padStart(2, '0')}`)
    this.livesText.setText(`× ${lives}`)
  }

  _setupTouchControls(W, H, game) {
    // タッチデバイスのみ表示
    const btnStyle = {
      fontSize: '28px', color: '#ffffff',
      backgroundColor: '#00000066',
      padding: { x: 18, y: 10 }
    }
    const BX = 60, BY = H - 60

    const btnL = this._makeBtn('←', BX,      BY, btnStyle)
    const btnR = this._makeBtn('→', BX + 90, BY, btnStyle)
    const btnJ = this._makeBtn('⬆', W - 70,  BY, btnStyle)

    const p = () => game?.player

    const bindBtn = (btn, down, up) => {
      btn.on('pointerdown',   down)
      btn.on('pointerup',     up)
      btn.on('pointerout',    up)
      btn.on('pointercancel', up)
    }

    bindBtn(btnL,
      () => { if (p()) p().touch.left  = true },
      () => { if (p()) p().touch.left  = false }
    )
    bindBtn(btnR,
      () => { if (p()) p().touch.right = true },
      () => { if (p()) p().touch.right = false }
    )
    bindBtn(btnJ,
      () => { if (p()) { p().touch.jump = true; p().triggerJump() } },
      () => { if (p()) p().touch.jump = false }
    )
  }

  _makeBtn(label, x, y, style) {
    return this.add.text(x, y, label, style)
      .setOrigin(0.5)
      .setInteractive({ cursor: 'pointer' })
      .setScrollFactor(0)
      .setDepth(100)
      .setAlpha(0.7)
  }
}
