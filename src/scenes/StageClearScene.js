export class StageClearScene extends Phaser.Scene {
  constructor() { super('StageClearScene') }

  init(data) {
    this.score     = data.score ?? 0
    this.timeBonus = data.timeBonus ?? 0
  }

  create() {
    const { width, height } = this.scale

    // 白→青フェード背景
    this.add.rectangle(width / 2, height / 2, width, height, 0x1a8cd8, 0.95)

    // STAGE CLEAR!
    this.add.text(width / 2, height / 2 - 110, 'STAGE CLEAR!', {
      fontFamily: 'monospace', fontSize: '44px', color: '#ffe000',
      stroke: '#000000', strokeThickness: 6
    }).setOrigin(0.5)

    // スコア表示
    const lines = [
      { label: 'SCORE',      value: this.score },
      { label: 'TIME BONUS', value: this.timeBonus },
      { label: 'TOTAL',      value: this.score + this.timeBonus },
    ]
    lines.forEach(({ label, value }, i) => {
      this.add.text(width / 2 - 120, height / 2 - 30 + i * 44, label, {
        fontFamily: 'monospace', fontSize: '20px', color: '#ffffff',
        stroke: '#000', strokeThickness: 3
      })
      this.add.text(width / 2 + 120, height / 2 - 30 + i * 44, String(value).padStart(6, '0'), {
        fontFamily: 'monospace', fontSize: '20px', color: '#ffe000',
        stroke: '#000', strokeThickness: 3
      }).setOrigin(1, 0)
    })

    // セパレーター
    this.add.rectangle(width / 2, height / 2 + 78, 280, 2, 0xffffff, 0.6)

    // ハイスコア更新チェック
    const total = this.score + this.timeBonus
    const hi = parseInt(localStorage.getItem('hi_score') ?? '0', 10)
    if (total > hi) {
      localStorage.setItem('hi_score', String(total))
      this.add.text(width / 2, height / 2 + 100, '★ NEW BEST SCORE! ★', {
        fontFamily: 'monospace', fontSize: '18px', color: '#ffd700',
        stroke: '#000', strokeThickness: 3
      }).setOrigin(0.5)
    }

    // タイトルへボタン
    this.time.delayedCall(2000, () => {
      const btn = this._makeButton(width / 2, height / 2 + 145, 'BACK TO TITLE', () => {
        this.scene.start('TitleScene')
      })
      this.tweens.add({ targets: btn, alpha: { from: 0, to: 1 }, duration: 400 })
    })

    // フェードイン
    this.cameras.main.fadeIn(400)
  }

  _makeButton(x, y, label, callback) {
    const btn = this.add.text(x, y, label, {
      fontFamily: 'monospace', fontSize: '22px', color: '#ffffff',
      backgroundColor: '#2266aa',
      padding: { x: 24, y: 12 },
      stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5).setInteractive({ cursor: 'pointer' })

    btn.on('pointerover',  () => btn.setStyle({ backgroundColor: '#3388cc' }))
    btn.on('pointerout',   () => btn.setStyle({ backgroundColor: '#2266aa' }))
    btn.on('pointerdown',  () => { this.cameras.main.fadeOut(300); this.time.delayedCall(300, callback) })
    return btn
  }
}
