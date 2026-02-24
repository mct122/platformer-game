export class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene') }

  init(data) {
    this.finalScore = data.score ?? 0
  }

  create() {
    const { width, height } = this.scale

    // 暗い背景
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.85)

    // GAME OVER
    this.add.text(width / 2, height / 2 - 80, 'GAME OVER', {
      fontFamily: 'monospace', fontSize: '48px', color: '#ff2020',
      stroke: '#000000', strokeThickness: 6
    }).setOrigin(0.5)

    // スコア
    this.add.text(width / 2, height / 2, `SCORE  ${String(this.finalScore).padStart(6, '0')}`, {
      fontFamily: 'monospace', fontSize: '24px', color: '#ffffff',
      stroke: '#000000', strokeThickness: 4
    }).setOrigin(0.5)

    // ハイスコア
    const hi = parseInt(localStorage.getItem('hi_score') ?? '0', 10)
    if (this.finalScore > hi) {
      localStorage.setItem('hi_score', String(this.finalScore))
      this.add.text(width / 2, height / 2 + 40, '★ NEW BEST! ★', {
        fontFamily: 'monospace', fontSize: '18px', color: '#ffd700',
        stroke: '#000000', strokeThickness: 3
      }).setOrigin(0.5)
    } else {
      this.add.text(width / 2, height / 2 + 40, `BEST  ${String(hi).padStart(6, '0')}`, {
        fontFamily: 'monospace', fontSize: '18px', color: '#aaaaaa',
        stroke: '#000000', strokeThickness: 3
      }).setOrigin(0.5)
    }

    // リトライボタン
    this._makeButton(width / 2 - 100, height / 2 + 110, 'RETRY', () => {
      this.scene.start('GameScene')
      this.scene.launch('UIScene')
    })

    // タイトルへ
    this._makeButton(width / 2 + 100, height / 2 + 110, 'TITLE', () => {
      this.scene.start('TitleScene')
    })

    // フェードイン
    this.cameras.main.fadeIn(300)
  }

  _makeButton(x, y, label, callback) {
    const btn = this.add.text(x, y, label, {
      fontFamily: 'monospace', fontSize: '22px', color: '#ffffff',
      backgroundColor: '#333333',
      padding: { x: 20, y: 10 },
      stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5).setInteractive({ cursor: 'pointer' })

    btn.on('pointerover',  () => btn.setStyle({ backgroundColor: '#555555' }))
    btn.on('pointerout',   () => btn.setStyle({ backgroundColor: '#333333' }))
    btn.on('pointerdown',  () => { this.cameras.main.fadeOut(300); this.time.delayedCall(300, callback) })
    return btn
  }
}
