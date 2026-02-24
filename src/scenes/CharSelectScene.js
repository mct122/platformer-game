import { CHARACTERS } from '../utils/GameData.js'
import { audio } from '../main.js'

export class CharSelectScene extends Phaser.Scene {
  constructor() { super('CharSelectScene') }

  create() {
    const { width, height } = this.scale

    // 背景
    this.add.image(width / 2, height / 2, 'sky').setDisplaySize(width, height)
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.45)

    this.add.text(width / 2, 60, 'キャラクターを選択', {
      fontFamily: 'monospace', fontSize: '24px', color: '#ffffff',
      stroke: '#000000', strokeThickness: 4
    }).setOrigin(0.5)

    this.add.text(width / 2, height - 30, 'タップまたはクリックで選択', {
      fontFamily: 'monospace', fontSize: '13px', color: '#aaaaaa'
    }).setOrigin(0.5)

    const gap = 220
    const startX = width / 2 - gap
    const cy = height / 2

    CHARACTERS.forEach((char, i) => {
      const x = startX + i * gap
      this._makeCard(x, cy, i, char)
    })
  }

  _makeCard(x, cy, idx, char) {
    const container = this.add.container(x, cy)

    // 背景パネル
    const bg = this.add.rectangle(0, 0, 140, 180, 0x000000, 0.5)
      .setStrokeStyle(2, 0x444466)
    container.add(bg)

    // 顔写真（円形テクスチャ）
    const avatar = this.add.image(0, -20, `avatar_${idx}`).setDisplaySize(100, 100)
    container.add(avatar)

    // 名前
    const name = this.add.text(0, 48, char.name, {
      fontFamily: 'monospace', fontSize: '15px', color: '#ffffff',
      stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5)
    container.add(name)

    // ホバー演出
    bg.setInteractive(new Phaser.Geom.Rectangle(-70, -90, 140, 180), Phaser.Geom.Rectangle.Contains)
    bg.on('pointerover', () => {
      this.tweens.add({ targets: container, scaleX: 1.08, scaleY: 1.08, duration: 120, ease: 'Back.Out' })
      bg.setStrokeStyle(3, 0x00d4ff)
    })
    bg.on('pointerout', () => {
      this.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 120 })
      bg.setStrokeStyle(2, 0x444466)
    })
    bg.on('pointerdown', () => {
      audio.play('coin')
      this.registry.set('charIndex', idx)
      this.cameras.main.fadeOut(300, 0, 0, 0)
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.stop('UIScene')
        this.scene.start('GameScene')
        this.scene.launch('UIScene')
      })
    })
  }
}
