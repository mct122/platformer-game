import { audio } from '../main.js'

export class TitleScene extends Phaser.Scene {
  constructor() { super('TitleScene') }

  create() {
    const W = this.scale.width
    const H = this.scale.height

    // 背景グラデーション（夜空風）
    const bg = this.add.graphics()
    bg.fillGradientStyle(0x0a0a1a, 0x0a0a1a, 0x001033, 0x001033, 1)
    bg.fillRect(0, 0, W, H)

    // 星（ランダム配置）
    for (let i = 0; i < 60; i++) {
      const x = Phaser.Math.Between(0, W)
      const y = Phaser.Math.Between(0, H * 0.7)
      const s = this.add.circle(x, y, Phaser.Math.Between(1, 2), 0xffffff, Phaser.Math.FloatBetween(0.3, 1))
      this.tweens.add({
        targets: s, alpha: 0,
        duration: Phaser.Math.Between(800, 2500),
        yoyo: true, repeat: -1,
        delay: Phaser.Math.Between(0, 2000)
      })
    }

    // 雲（背景）
    if (this.textures.exists('cloud')) {
      [120, 450, 720, 880].forEach((cx, i) => {
        this.add.image(cx, 80 + i * 15, 'cloud').setAlpha(0.25).setScale(0.9 + i * 0.05)
      })
    }

    // タイトルロゴ（グロー風）
    this.add.text(W / 2 + 3, H / 2 - 105, 'SUPER PLATFORMER', {
      fontFamily: '"Orbitron", monospace', fontSize: '38px',
      fontStyle: 'bold', color: '#001133'
    }).setOrigin(0.5).setAlpha(0.7)

    this.add.text(W / 2, H / 2 - 108, 'SUPER PLATFORMER', {
      fontFamily: '"Orbitron", monospace', fontSize: '38px',
      fontStyle: 'bold', color: '#00d4ff',
      stroke: '#003366', strokeThickness: 6
    }).setOrigin(0.5)

    // ハイスコア
    const hi = parseInt(localStorage.getItem('hi_score') ?? '0', 10)
    this.add.text(W / 2, H / 2 - 52, `BEST  ${String(hi).padStart(6, '0')}`, {
      fontFamily: '"Orbitron", monospace', fontSize: '15px',
      color: '#ffd700', stroke: '#332200', strokeThickness: 3
    }).setOrigin(0.5)

    // 点滅テキスト
    const blink = this.add.text(W / 2, H / 2 + 22, '▶  PRESS ANY KEY TO START', {
      fontFamily: '"Orbitron", monospace', fontSize: '17px',
      color: '#ffffff', stroke: '#000033', strokeThickness: 3
    }).setOrigin(0.5)
    this.tweens.add({ targets: blink, alpha: 0.1, duration: 600, yoyo: true, repeat: -1 })

    // 操作説明
    this.add.text(W / 2, H - 44, '←→ : MOVE    ↑ / SPACE : JUMP    P : PAUSE', {
      fontFamily: '"Orbitron", monospace', fontSize: '11px',
      color: '#556688', stroke: '#000011', strokeThickness: 2
    }).setOrigin(0.5)

    // バージョン
    this.add.text(10, H - 18, 'v2.2', {
      fontFamily: '"Orbitron", monospace', fontSize: '10px', color: '#334455'
    })

    const start = () => {
      audio.resume()
      audio.play('coin')
      this.cameras.main.fadeOut(300)
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('CharSelectScene'))
    }
    this.input.once('pointerdown', start)
    this.input.keyboard.once('keydown', start)

    this.cameras.main.fadeIn(500)
  }
}
