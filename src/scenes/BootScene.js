import { CHARACTERS } from '../utils/GameData.js'

export class BootScene extends Phaser.Scene {
  constructor() { super('BootScene') }

  preload() {
    // ローディングバー
    const bar = this.add.rectangle(480, 270, 0, 20, 0x00d4ff)
    this.load.on('progress', v => bar.setSize(v * 600, 20))

    this.add.text(480, 240, 'Loading...', {
      fontFamily: 'monospace', fontSize: '20px', color: '#ffffff'
    }).setOrigin(0.5)

    // 背景
    this.load.image('sky', 'assets/sky.png')

    // 敵・アイテム
    this.load.image('enemy', 'assets/enemy.png')
    this.load.image('koopa', 'assets/koopa.png')
    this.load.image('mushroom', 'assets/mushroom.png')

    // キャラクター写真をすべてロード
    CHARACTERS.forEach((c, i) => {
      this.load.image(`char_normal_${i}`, c.normal)
      this.load.image(`char_super_${i}`, c.super)
    })
  }

  create() {
    // 各キャラの円形テクスチャを事前生成（選択画面用・プレイヤー用）
    CHARACTERS.forEach((c, i) => {
      this._makeCircleTex(`avatar_${i}`, `char_normal_${i}`, 60)
      this._makeCircleTex(`player_small_${i}`, `char_normal_${i}`, 44)
      this._makeCircleTex(`player_big_${i}`, `char_super_${i}`, 56)
    })
    this.scene.start('TitleScene')
  }

  /** 写真を円形にクリップしたテクスチャを生成 */
  _makeCircleTex(key, srcKey, size) {
    const rt = this.add.renderTexture(0, 0, size, size).setVisible(false)
    const tmp = this.add.image(size / 2, size / 2, srcKey)
      .setDisplaySize(size, size)
      .setVisible(false)
    const mask = this.make.graphics({ add: false })
    mask.fillStyle(0xffffff)
    mask.fillCircle(size / 2, size / 2, size / 2)
    tmp.setMask(mask.createGeometryMask())
    rt.draw(tmp, 0, 0)
    rt.saveTexture(key)
    tmp.destroy()
    mask.destroy()
    rt.destroy()
  }
}
