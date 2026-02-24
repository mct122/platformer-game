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

    // タイトル
    this.add.text(W / 2, 52, 'SELECT CHARACTER', {
      fontFamily: '"Orbitron", monospace', fontSize: '26px',
      fontStyle: 'bold', color: '#00d4ff',
      stroke: '#003366', strokeThickness: 5
    }).setOrigin(0.5)

    // アンダーライン
    this.add.rectangle(W / 2, 78, 360, 2, 0x00d4ff, 0.4)

    this.add.text(W / 2, H - 30, 'TAP OR CLICK TO SELECT', {
      fontFamily: '"Orbitron", monospace', fontSize: '11px', color: '#445566'
    }).setOrigin(0.5)

    const gap = 220
    const startX = W / 2 - gap
    const cy = H / 2 + 20

    CHARACTERS.forEach((char, i) => {
      this._makeCard(startX + i * gap, cy, i, char)
    })

    this.cameras.main.fadeIn(400)
  }

  _makeCard(x, cy, idx, char) {
    const container = this.add.container(x, cy)
    const W_CARD = 150, H_CARD = 200

    // カードの外枠（グロー用）
    const glow = this.add.rectangle(0, 0, W_CARD + 6, H_CARD + 6, char.color, 0.15)
      .setStrokeStyle(2, char.color, 0.3)
    container.add(glow)

    // カード背景
    const cardBg = this.add.rectangle(0, 0, W_CARD, H_CARD, 0x0a1020, 0.9)
      .setStrokeStyle(2, 0x223355)
    container.add(cardBg)

    // アバター（透過PNG）
    const avatar = this.add.image(0, -28, `avatar_${idx}`)
      .setDisplaySize(110, 110)
    container.add(avatar)

    // カラーアクセントライン
    const accent = this.add.rectangle(0, 35, W_CARD - 20, 2, char.color, 0.8)
    container.add(accent)

    // キャラ名
    const nameText = this.add.text(0, 46, char.name.toUpperCase(), {
      fontFamily: '"Orbitron", monospace', fontSize: '14px',
      fontStyle: 'bold', color: '#ffffff',
      stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5)
    container.add(nameText)

    // タイプタグ
    const tagHex = char.color.toString(16).padStart(6, '0')
    const tagText = this.add.text(0, 63, char.tag ?? '', {
      fontFamily: '"Orbitron", monospace', fontSize: '9px',
      color: `#${tagHex}`, stroke: '#000000', strokeThickness: 2
    }).setOrigin(0.5)
    container.add(tagText)

    // ステータスバー (SPEED / JUMP)
    const stats = char.stats
    const maxSpeed = 340, maxJump = 820
    const speedPct = (stats?.speed ?? 260) / maxSpeed
    const jumpPct  = Math.abs(stats?.jump ?? 690) / maxJump
    const barW = W_CARD - 30
    const barStartX = -(barW / 2)
    const lblStyle = { fontFamily: '"Orbitron", monospace', fontSize: '8px', color: '#778899' }

    // SPEED bar
    const spdLbl  = this.add.text(barStartX, 76, 'SPD', lblStyle).setOrigin(0, 0.5)
    const spdBg   = this.add.rectangle(barStartX + 22, 76, barW - 22, 5, 0x223355).setOrigin(0, 0.5)
    const spdFill = this.add.rectangle(barStartX + 22, 76, (barW - 22) * speedPct, 5, char.color, 0.9).setOrigin(0, 0.5)
    container.add([spdLbl, spdBg, spdFill])

    // JUMP bar
    const jmpLbl  = this.add.text(barStartX, 88, 'JMP', lblStyle).setOrigin(0, 0.5)
    const jmpBg   = this.add.rectangle(barStartX + 22, 88, barW - 22, 5, 0x223355).setOrigin(0, 0.5)
    const jmpFill = this.add.rectangle(barStartX + 22, 88, (barW - 22) * jumpPct, 5, char.color, 0.9).setOrigin(0, 0.5)
    container.add([jmpLbl, jmpBg, jmpFill])

    // SELECT ラベル（非表示・ホバー時に出る）
    const selectLabel = this.add.text(0, 80, 'SELECT', {
      fontFamily: '"Orbitron", monospace', fontSize: '11px',
      color: `#${tagHex}`,
      stroke: '#000000', strokeThickness: 2
    }).setOrigin(0.5).setAlpha(0)
    container.add(selectLabel)

    // インタラクション
    cardBg.setInteractive(
      new Phaser.Geom.Rectangle(-W_CARD / 2, -H_CARD / 2, W_CARD, H_CARD),
      Phaser.Geom.Rectangle.Contains
    )

    cardBg.on('pointerover', () => {
      this.tweens.add({ targets: container, scaleX: 1.07, scaleY: 1.07, duration: 130, ease: 'Back.Out' })
      cardBg.setStrokeStyle(2, char.color)
      glow.setAlpha(0.35)
      selectLabel.setAlpha(1)
    })
    cardBg.on('pointerout', () => {
      this.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 130 })
      cardBg.setStrokeStyle(2, 0x223355)
      glow.setAlpha(0.15)
      selectLabel.setAlpha(0)
    })
    cardBg.on('pointerdown', () => {
      audio.play('coin')
      this.registry.set('charIndex', idx)
      this.registry.set('lives', 3)
      this.cameras.main.fadeOut(300, 0, 0, 0)
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.stop('UIScene')
        this.scene.start('GameScene')
        this.scene.launch('UIScene')
      })
    })
  }
}
