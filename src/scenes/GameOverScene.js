export class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene') }

  init(data) {
    this.finalScore = data.score ?? 0
  }

  create() {
    const W = this.scale.width
    const H = this.scale.height

    // 背景グラデーション
    const bg = this.add.graphics()
    bg.fillGradientStyle(0x1a0000, 0x1a0000, 0x000000, 0x000000, 1)
    bg.fillRect(0, 0, W, H)

    // GAME OVER（グロー風二重描画）
    this.add.text(W / 2 + 2, H / 2 - 112, 'GAME OVER', {
      fontFamily: '"Orbitron", monospace', fontSize: '50px',
      fontStyle: 'bold', color: '#550000'
    }).setOrigin(0.5).setAlpha(0.6)

    this.add.text(W / 2, H / 2 - 114, 'GAME OVER', {
      fontFamily: '"Orbitron", monospace', fontSize: '50px',
      fontStyle: 'bold', color: '#ff2222',
      stroke: '#330000', strokeThickness: 6
    }).setOrigin(0.5)

    // スコア
    this.add.text(W / 2, H / 2 - 40, 'SCORE', {
      fontFamily: '"Orbitron", monospace', fontSize: '13px', color: '#aaaacc'
    }).setOrigin(0.5)
    this.add.text(W / 2, H / 2 - 18, String(this.finalScore).padStart(6, '0'), {
      fontFamily: '"Orbitron", monospace', fontSize: '34px',
      fontStyle: 'bold', color: '#ffffff', stroke: '#000000', strokeThickness: 4
    }).setOrigin(0.5)

    // ハイスコア
    const hi = parseInt(localStorage.getItem('hi_score') ?? '0', 10)
    if (this.finalScore > hi) {
      localStorage.setItem('hi_score', String(this.finalScore))
      this.add.text(W / 2, H / 2 + 28, '★ NEW BEST! ★', {
        fontFamily: '"Orbitron", monospace', fontSize: '16px',
        color: '#ffd700', stroke: '#443300', strokeThickness: 3
      }).setOrigin(0.5)
    } else {
      this.add.text(W / 2, H / 2 + 28, `BEST  ${String(hi).padStart(6, '0')}`, {
        fontFamily: '"Orbitron", monospace', fontSize: '14px',
        color: '#666688', stroke: '#000000', strokeThickness: 2
      }).setOrigin(0.5)
    }

    this.add.rectangle(W / 2, H / 2 + 52, 260, 1, 0xff2222, 0.4)

    // ボタン（縦並び）
    this._makeBtn(W / 2, H / 2 + 90,  '▶  RETRY', 0x882222, () => {
      this.cameras.main.fadeOut(250)
      this.time.delayedCall(250, () => {
        this.scene.start('GameScene')
        this.scene.launch('UIScene')
      })
    })
    this._makeBtn(W / 2, H / 2 + 150, '⌂  TITLE', 0x333355, () => {
      this.cameras.main.fadeOut(250)
      this.time.delayedCall(250, () => this.scene.start('TitleScene'))
    })

    this.cameras.main.fadeIn(400)
  }

  _makeBtn(x, y, label, bgColor, cb) {
    const hex = bgColor.toString(16).padStart(6, '0')
    const btn = this.add.text(x, y, label, {
      fontFamily: '"Orbitron", monospace', fontSize: '18px',
      color: '#ffffff',
      backgroundColor: `#${hex}dd`,
      padding: { x: 40, y: 14 },
      stroke: '#000000', strokeThickness: 2
    }).setOrigin(0.5).setInteractive({ cursor: 'pointer' })

    btn.on('pointerover', () => btn.setAlpha(0.8))
    btn.on('pointerout',  () => btn.setAlpha(1))
    btn.on('pointerdown', cb)
    return btn
  }
}
