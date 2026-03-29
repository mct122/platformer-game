import { audio } from '../main.js'

export class QuestionBlock extends Phaser.Physics.Arcade.Image {
  constructor(scene, x, y, content = 'coin') {
    super(scene, x, y, '__DEFAULT')
    scene.add.existing(this)
    scene.physics.add.existing(this, true) // static
    this.setDisplaySize(32, 32)
    this.content = content
    this._hasContent = true
    this._originY = y
    this._draw()
  }

  _draw() {
    // Graphics でブロックを描画してテクスチャに焼く
    // （既にテクスチャがあれば再利用）
    const key = this._hasContent ? 'qblock_active' : 'qblock_used'
    if (!this.scene.textures.exists(key)) {
      const g = this.scene.make.graphics({ add: false })
      if (this._hasContent) {
        g.fillStyle(0xffd700).fillRect(0, 0, 32, 32)
        g.fillStyle(0x000000)
        g.fillRect(0, 0, 32, 2).fillRect(0, 30, 32, 2)
        g.fillRect(0, 0, 2, 32).fillRect(30, 0, 2, 32)
        // ?マーク
        g.fillRect(11, 6, 10, 2).fillRect(9, 8, 2, 4)
        g.fillRect(11, 8, 4, 2).fillRect(13, 10, 2, 6)
        g.fillRect(11, 18, 10, 2).fillRect(11, 22, 10, 2)
      } else {
        g.fillStyle(0x8B4513).fillRect(0, 0, 32, 32)
        g.fillStyle(0x000000)
        g.fillRect(0, 0, 32, 2).fillRect(0, 30, 32, 2)
        g.fillRect(0, 0, 2, 32).fillRect(30, 0, 2, 32)
      }
      g.generateTexture(key, 32, 32)
      g.destroy()
    }
    this.setTexture(key)
  }

  hitFromBelow(player) {
    if (!this._hasContent) {
      // バンプアニメのみ
      this._bump()
      return
    }
    this._hasContent = false
    this._draw()
    this._bump()
    audio.play('block')

    if (this.content === 'coin') {
      this.scene.events.emit('addCoin')
      this.scene.events.emit('addScore', 200)
      this._spawnCoinEffect()
    } else if (this.content === 'mushroom') {
      this.scene.events.emit('spawnMushroom', this.x, this.y - 32)
    }
  }

  _bump() {
    this.scene.tweens.add({
      targets: this,
      y: this._originY - 10,
      duration: 80,
      yoyo: true,
      ease: 'Quad.Out',
      onComplete: () => { this.body.reset(this.x, this._originY) }
    })
  }

  _spawnCoinEffect() {
    // コインが飛び出るエフェクト
    const coin = this.scene.add.rectangle(this.x, this.y - 16, 14, 14, 0xffd700)
    this.scene.tweens.add({
      targets: coin, y: this.y - 80, alpha: 0,
      duration: 500, ease: 'Quad.Out',
      onComplete: () => coin.destroy()
    })
  }
}
