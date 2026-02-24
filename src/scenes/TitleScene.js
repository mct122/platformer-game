import { audio } from '../main.js'

export class TitleScene extends Phaser.Scene {
  constructor() { super('TitleScene') }

  create() {
    const { width, height } = this.scale

    // 背景
    this.add.image(width / 2, height / 2, 'sky').setDisplaySize(width, height)

    // タイトル
    this.add.text(width / 2, height / 2 - 80, 'SUPER RETRO PLATFORMER', {
      fontFamily: 'monospace',
      fontSize: '32px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5)

    // 点滅テキスト
    const blink = this.add.text(width / 2, height / 2 + 30, '画面をタップしてスタート', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#ffe000',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5)
    this.tweens.add({ targets: blink, alpha: 0, duration: 500, yoyo: true, repeat: -1 })

    // 操作説明
    this.add.text(width / 2, height - 40, '← → : 移動　↑ / Space : ジャンプ', {
      fontFamily: 'monospace', fontSize: '13px', color: '#aaaaaa'
    }).setOrigin(0.5)

    // タップ/クリックでキャラ選択へ
    this.input.once('pointerdown', () => {
      audio.resume()
      audio.play('coin')
      this.scene.start('CharSelectScene')
    })
    this.input.keyboard.once('keydown', () => {
      audio.resume()
      audio.play('coin')
      this.scene.start('CharSelectScene')
    })
  }
}
