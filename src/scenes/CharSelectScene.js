import { CHARACTERS } from '../utils/GameData.js'
import { audio } from '../main.js'

export class CharSelectScene extends Phaser.Scene {
  constructor() { super('CharSelectScene') }

  create() {
    const W = this.scale.width
    const H = this.scale.height

    // 背景
    const bg = this.add.graphics()
    bg.fillGradientStyle(0x0a0a1a, 0x0a0a1a, 0x001033, 0x001033, 1)
    bg.fillRect(0, 0, W, H)

    // 背景の光るライン装飾
    for (let i = 0; i < 3; i++) {
      this.add.rectangle(W / 2, H * (0.3 + i * 0.25), W, 1, 0x00d4ff, 0.05)
    }

    // タイトル
    this.add.text(W / 2, 44, 'SELECT CHARACTER', {
      fontFamily: '"Orbitron", monospace', fontSize: '24px',
      fontStyle: 'bold', color: '#00d4ff',
      stroke: '#003366', strokeThickness: 5
    }).setOrigin(0.5)
    this.add.rectangle(W / 2, 68, 340, 2, 0x00d4ff, 0.35)

    this.add.text(W / 2, H - 24, 'CLICK OR TAP TO SELECT', {
      fontFamily: '"Orbitron", monospace', fontSize: '10px', color: '#334455'
    }).setOrigin(0.5)

    // カード間隔：画面幅に合わせて均等配置
    const gap = Math.min(260, (W - 60) / 3)
    const startX = W / 2 - gap
    const cy = H / 2 + 28

    CHARACTERS.forEach((char, i) => {
      this._makeCard(startX + i * gap, cy, i, char)
    })

    this.cameras.main.fadeIn(400)
  }

  _makeCard(x, cy, idx, char) {
    const container = this.add.container(x, cy)
    const W_CARD = 168
    const H_CARD = 290
    const hexColor = char.color.toString(16).padStart(6, '0')

    // 外グロー
    const glow = this.add.rectangle(0, 0, W_CARD + 8, H_CARD + 8, char.color, 0.12)
      .setStrokeStyle(2, char.color, 0.25)
    container.add(glow)

    // カード背景
    const cardBg = this.add.rectangle(0, 0, W_CARD, H_CARD, 0x060d1a, 0.95)
      .setStrokeStyle(1.5, 0x1a2a44)
    container.add(cardBg)

    // ===== キャラクター画像（ポートレート・大きく表示） =====
    const charImg = this.add.image(0, -52, `avatar_${idx}`)
      .setDisplaySize(W_CARD - 8, 190)
      .setOrigin(0.5, 0.5)
    container.add(charImg)

    // カラーアクセントライン
    const accent = this.add.rectangle(0, 44, W_CARD - 16, 2, char.color, 0.9)
    container.add(accent)

    // キャラ名
    const nameText = this.add.text(0, 56, char.name.toUpperCase(), {
      fontFamily: '"Orbitron", monospace', fontSize: '13px',
      fontStyle: 'bold', color: '#ffffff',
      stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5)
    container.add(nameText)

    // タイプタグ（バッジ風）
    const tagBg = this.add.rectangle(0, 74, 80, 14, char.color, 0.2)
      .setStrokeStyle(1, char.color, 0.6)
    const tagText = this.add.text(0, 74, char.tag ?? '', {
      fontFamily: '"Orbitron", monospace', fontSize: '8px',
      color: `#${hexColor}`
    }).setOrigin(0.5)
    container.add([tagBg, tagText])

    // ステータスバー
    const stats = char.stats
    const maxSpeed = 340, maxJump = 820
    const speedPct = (stats?.speed ?? 260) / maxSpeed
    const jumpPct  = Math.abs(stats?.jump ?? 690) / maxJump
    const barW = W_CARD - 28
    const bx = -(barW / 2)
    const lblStyle = { fontFamily: '"Orbitron", monospace', fontSize: '8px', color: '#556677' }

    // SPD bar
    const s1 = this.add.text(bx, 93, 'SPD', lblStyle).setOrigin(0, 0.5)
    const s2 = this.add.rectangle(bx + 24, 93, barW - 24, 5, 0x111e30).setOrigin(0, 0.5)
    const s3 = this.add.rectangle(bx + 24, 93, (barW - 24) * speedPct, 5, char.color, 0.85).setOrigin(0, 0.5)
    container.add([s1, s2, s3])

    // JMP bar
    const j1 = this.add.text(bx, 107, 'JMP', lblStyle).setOrigin(0, 0.5)
    const j2 = this.add.rectangle(bx + 24, 107, barW - 24, 5, 0x111e30).setOrigin(0, 0.5)
    const j3 = this.add.rectangle(bx + 24, 107, (barW - 24) * jumpPct, 5, char.color, 0.85).setOrigin(0, 0.5)
    container.add([j1, j2, j3])

    // SELECT ラベル（ホバー時に表示）
    const selectLabel = this.add.text(0, 126, '▶  SELECT', {
      fontFamily: '"Orbitron", monospace', fontSize: '11px',
      color: `#${hexColor}`, stroke: '#000000', strokeThickness: 2
    }).setOrigin(0.5).setAlpha(0)
    container.add(selectLabel)

    // インタラクション
    cardBg.setInteractive(
      new Phaser.Geom.Rectangle(-W_CARD / 2, -H_CARD / 2, W_CARD, H_CARD),
      Phaser.Geom.Rectangle.Contains
    )

    cardBg.on('pointerover', () => {
      this.tweens.add({ targets: container, scaleX: 1.06, scaleY: 1.06, duration: 150, ease: 'Back.Out' })
      cardBg.setStrokeStyle(2, char.color, 0.8)
      glow.setFillStyle(char.color, 0.22).setStrokeStyle(2, char.color, 0.6)
      selectLabel.setAlpha(1)
      this.tweens.add({ targets: charImg, y: charImg.y - 6, duration: 150 })
    })
    cardBg.on('pointerout', () => {
      this.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 150 })
      cardBg.setStrokeStyle(1.5, 0x1a2a44)
      glow.setFillStyle(char.color, 0.12).setStrokeStyle(2, char.color, 0.25)
      selectLabel.setAlpha(0)
      this.tweens.add({ targets: charImg, y: -52, duration: 150 })
    })
    cardBg.on('pointerdown', () => {
      audio.play('coin')
      this.registry.set('charIndex', idx)
      this.registry.set('lives', 3)
      // 選択エフェクト
      this.tweens.add({ targets: container, scaleX: 0.95, scaleY: 0.95, duration: 80, yoyo: true,
        onComplete: () => {
          this.cameras.main.fadeOut(300, 0, 0, 0)
          this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.stop('UIScene')
            this.scene.start('GameScene')
            this.scene.launch('UIScene')
          })
        }
      })
    })
  }
}
