export class StageClearScene extends Phaser.Scene {
  constructor() { super('StageClearScene') }

  init(data) {
    this.score     = data.score ?? 0
    this.timeBonus = data.timeBonus ?? 0
  }

  create() {
    const W = this.scale.width
    const H = this.scale.height
    const total = this.score + this.timeBonus

    // 背景
    const bg = this.add.graphics()
    bg.fillGradientStyle(0x001133, 0x001133, 0x000820, 0x000820, 1)
    bg.fillRect(0, 0, W, H)

    // キラキラ（装飾）
    for (let i = 0; i < 20; i++) {
      const x = Phaser.Math.Between(20, W - 20)
      const y = Phaser.Math.Between(20, H - 20)
      const star = this.add.text(x, y, '✦', {
        fontSize: `${Phaser.Math.Between(10, 22)}px`,
        color: '#ffd700', alpha: 0.3
      }).setAlpha(Phaser.Math.FloatBetween(0.1, 0.5))
      this.tweens.add({
        targets: star, alpha: 0,
        duration: Phaser.Math.Between(800, 2000),
        yoyo: true, repeat: -1,
        delay: Phaser.Math.Between(0, 1000)
      })
    }

    // STAGE CLEAR!
    this.add.text(W / 2 + 2, H / 2 - 132, 'STAGE CLEAR!', {
      fontFamily: '"Orbitron", monospace', fontSize: '42px',
      fontStyle: 'bold', color: '#443300'
    }).setOrigin(0.5).setAlpha(0.5)

    this.add.text(W / 2, H / 2 - 134, 'STAGE CLEAR!', {
      fontFamily: '"Orbitron", monospace', fontSize: '42px',
      fontStyle: 'bold', color: '#ffd700',
      stroke: '#442200', strokeThickness: 6
    }).setOrigin(0.5)

    // スコア表
    const rows = [
      { label: 'SCORE',      value: this.score,     color: '#ffffff' },
      { label: 'TIME BONUS', value: this.timeBonus,  color: '#88ffaa' },
      { label: 'TOTAL',      value: total,           color: '#ffd700' },
    ]
    rows.forEach(({ label, value, color }, i) => {
      const y = H / 2 - 50 + i * 44
      this.add.text(W / 2 - 110, y, label, {
        fontFamily: '"Orbitron", monospace', fontSize: '14px', color: '#aaaacc'
      })
      const numText = this.add.text(W / 2 + 110, y, '000000', {
        fontFamily: '"Orbitron", monospace', fontSize: '22px',
        fontStyle: 'bold', color, stroke: '#000000', strokeThickness: 3
      }).setOrigin(1, 0)
      // カウントアップアニメ
      this.tweens.addCounter({
        from: 0, to: value,
        duration: 600,
        delay: i * 250,
        ease: 'Quad.Out',
        onUpdate: t => numText.setText(String(Math.floor(t.getValue())).padStart(6, '0'))
      })
    })

    // セパレーター
    this.add.rectangle(W / 2, H / 2 + 78, 260, 1, 0xffd700, 0.5)

    // ハイスコア
    const hi = parseInt(localStorage.getItem('hi_score') ?? '0', 10)
    if (total > hi) {
      localStorage.setItem('hi_score', String(total))
      const newBest = this.add.text(W / 2, H / 2 + 100, '★ NEW BEST SCORE! ★', {
        fontFamily: '"Orbitron", monospace', fontSize: '16px',
        color: '#ffd700', stroke: '#443300', strokeThickness: 3
      }).setOrigin(0.5)
      this.tweens.add({ targets: newBest, scaleX: 1.1, scaleY: 1.1, duration: 400, yoyo: true, repeat: -1 })
    }

    // タイトルへボタン（1.5秒後に表示）
    this.time.delayedCall(1500, () => {
      const btn = this._makeBtn(W / 2, H / 2 + 148, '⌂  BACK TO TITLE', 0x1a3366, () => {
        this.cameras.main.fadeOut(300)
        this.time.delayedCall(300, () => this.scene.start('TitleScene'))
      })
      this.tweens.add({ targets: btn, alpha: { from: 0, to: 1 }, duration: 400 })
    })

    this.cameras.main.fadeIn(500)
  }

  _makeBtn(x, y, label, bgColor, cb) {
    const hex = bgColor.toString(16).padStart(6, '0')
    const btn = this.add.text(x, y, label, {
      fontFamily: '"Orbitron", monospace', fontSize: '18px',
      color: '#ffffff',
      backgroundColor: `#${hex}ee`,
      padding: { x: 32, y: 14 },
      stroke: '#000000', strokeThickness: 2
    }).setOrigin(0.5).setInteractive({ cursor: 'pointer' })

    btn.on('pointerover', () => btn.setAlpha(0.8))
    btn.on('pointerout',  () => btn.setAlpha(1))
    btn.on('pointerdown', cb)
    return btn
  }
}
