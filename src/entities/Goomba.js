import { audio } from '../main.js'

export class Goomba extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, speed = 60) {
    super(scene, x, y, 'enemy')
    scene.add.existing(this)
    scene.physics.add.existing(this)
    this.setDisplaySize(36, 36)
    this.body.setSize(32, 32)
    this.setDepth(5)
    this.speed = speed
    this.isDead = false
    this._deadTimer = 0
    this.body.setVelocityX(-this.speed)

    // のしのし歩きアニメ（スケール揺れ）
    this._walkTween = scene.tweens.add({
      targets: this,
      scaleX: 1.08,
      scaleY: 0.94,
      duration: 220,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut'
    })
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
    this._walkTween?.stop()
    this.body.setVelocity(0)
    this.body.setGravityY(-2600)
    // 潰れ演出
    this.setDisplaySize(36, 16)
    this.setY(this.y + 10)
    this.setAlpha(0.8)
    audio.play('stomp')
    player.body.setVelocityY(-380)
    this.scene.events.emit('addScore', 100)
    // VFX
    this.scene.events.emit('vfx_stomp', this.x, this.y, 0xff8800)
  }

  killByShell(shell) {
    if (this.isDead) return
    this.isDead = true
    this._walkTween?.stop()
    this.body.checkCollision.none = true
    const dir = shell.x < this.x ? 1 : -1
    this.body.setVelocity(dir * 150, -300)
    this.body.setGravityY(-2600 + 1200)
    this.setFlipY(true)
    audio.play('stomp')
    this.scene.events.emit('addScore', 100)
    this.scene.events.emit('vfx_stomp', this.x, this.y, 0xff8800)
  }

  touchPlayer(player) {
    player.takeDamage()
  }
}
