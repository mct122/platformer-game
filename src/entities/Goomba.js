import { audio } from '../main.js'

export class Goomba extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'enemy')
    scene.add.existing(this)
    scene.physics.add.existing(this)
    this.setDisplaySize(36, 36)
    this.body.setSize(32, 32)
    this.setDepth(5)
    this.speed = 60
    this.isDead = false
    this._deadTimer = 0
    this.body.setVelocityX(-this.speed)
  }

  update(dt) {
    if (this.isDead) {
      this._deadTimer += dt
      if (this._deadTimer > 0.5) this.destroy()
      return
    }
    // 壁・端で折り返し
    if (this.body.blocked.left)  this.body.setVelocityX(this.speed)
    if (this.body.blocked.right) this.body.setVelocityX(-this.speed)
    this.setFlipX(this.body.velocity.x > 0)
  }

  stomp(player) {
    this.isDead = true
    this.body.setVelocity(0)
    this.body.setGravityY(-2600) // 潰れたまま浮く
    this.setDisplaySize(36, 16)
    this.setY(this.y + 10)
    this.setAlpha(0.8)
    audio.play('stomp')
    player.body.setVelocityY(-380) // プレイヤーバウンス
    this.scene.events.emit('addScore', 100)
  }

  touchPlayer(player) {
    player.takeDamage()
  }
}
