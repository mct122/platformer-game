import { audio } from '../main.js'

export class TitleScene extends Phaser.Scene {
  constructor() { super('TitleScene') }

  create() {
    const { width, height } = this.scale

    // 背景グラデーション
    const bg = this.add.graphics()
    bg.fillGradientStyle(0x1a6fa8, 0x1a6fa8, 0x5bc8f5, 0x5bc8f5, 1)
    bg.fillRect(0, 0, width, height)

    // 雲の装飾
    if (this.textures.exists('cloud')) {
      [150, 500, 750].forEach((cx, i) => {
        this.add.image(cx, 80 + i * 20, 'cloud').setAlpha(0.8)
      })
    }

    // タイトルロゴ（影付き）
    this.add.text(width / 2 + 3, height / 2 - 103, 'SUPER RETRO PLATFORMER', {
      fontFamily: 'monospace', fontSize: '34px', color: '#000000'
    }).setOrigin(0.5).setAlpha(0.4)

    this.add.text(width / 2, height / 2 - 106, 'SUPER RETRO PLATFORMER', {
      fontFamily: 'monospace', fontSize: '34px', color: '#ffe000',
      stroke: '#c84c00', strokeThickness: 6
    }).setOrigin(0.5)

    // ハイスコア表示
    const hi = parseInt(localStorage.getItem('hi_score') ?? '0', 10)
    this.add.text(width / 2, height / 2 - 50, `BEST  ${String(hi).padStart(6, '0')}`, {
      fontFamily: 'monospace', fontSize: '16px', color: '#ffffff',
      stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5)

    // 点滅テキスト
    const blink = this.add.text(width / 2, height / 2 + 30, '▶  PRESS ANY KEY TO START', {
      fontFamily: 'monospace', fontSize: '18px', color: '#ffe000',
      stroke: '#000000', strokeThickness: 4
    }).setOrigin(0.5)
    this.tweens.add({ targets: blink, alpha: 0, duration: 500, yoyo: true, repeat: -1 })

    // 操作説明
    this.add.text(width / 2, height - 40, '← → : 移動　  ↑ / Space : ジャンプ', {
      fontFamily: 'monospace', fontSize: '13px', color: '#cccccc',
      stroke: '#000', strokeThickness: 2
    }).setOrigin(0.5)

    // バージョン
    this.add.text(8, height - 20, 'v2.0 Phaser3', {
      fontFamily: 'monospace', fontSize: '11px', color: '#888888'
    })

    // タップ/クリック/キーでキャラ選択へ
    const start = () => {
      audio.resume()
      audio.play('coin')
      this.cameras.main.fadeOut(250)
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('CharSelectScene')
      })
    }
    this.input.once('pointerdown', start)
    this.input.keyboard.once('keydown', start)

    this.cameras.main.fadeIn(400)
  }
}
