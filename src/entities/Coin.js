/** ワールドコイン：レベル上に配置されたコレクタブル */
export class Coin extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'coin')
    scene.add.existing(this)
    scene.physics.add.existing(this)
    this.body.setAllowGravity(false)
    this.body.setImmovable(true)
    this.body.setSize(20, 20)
    this.setDisplaySize(22, 22)
    this.setDepth(4)
    this._collected = false

    // スピンアニメーション（scaleX 0→1→0 の繰り返しでコインが回転して見える）
    scene.tweens.add({
      targets: this,
      scaleX: 0.1,
      duration: 300,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut'
    })
  }

  collect() {
    if (this._collected) return
    this._collected = true
    this.body.enable = false

    // 跳び上がってフェードアウト
    this.scene.tweens.add({
      targets: this,
      y: this.y - 40,
      alpha: 0,
      scaleX: 1,
      duration: 250,
      onComplete: () => this.destroy()
    })

    // GameScene の addCoin イベントを発火
    this.scene.events.emit('addCoin')
  }
}
