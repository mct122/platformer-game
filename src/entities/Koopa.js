import { audio } from '../main.js'

/** ノコノコ: 踏むと甲羅に。甲羅状態で接触すると蹴れる。 */
export class Koopa extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'koopa')
    scene.add.existing(this)
    scene.physics.add.existing(this)
    this.setDisplaySize(36, 48)
    this.body.setSize(32, 44)
    this.setDepth(5)
    this.state = 'walking'
    this.speed = 45
    this.isDead = false
    this.body.setVelocityX(-this.speed)

    // 歩きアニメ
    this._walkTween = scene.tweens.add({
      targets: this,
      angle: { from: -5, to: 5 },
      duration: 280,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut'
    })
  }

  update(dt) {
    if (this.isDead) { this.destroy(); return }
    if (this.state === 'walking') {
      if (this.body.blocked.left)  this.body.setVelocityX(this.speed)
      if (this.body.blocked.right) this.body.setVelocityX(-this.speed)
      this.setFlipX(this.body.velocity.x > 0)
    } else if (this.state === 'shell_moving') {
      if (this.body.blocked.left || this.body.blocked.right) {
        this.body.setVelocityX(-this.body.velocity.x)
        // シェルが壁に当たった時のスパーク
        this.scene.events.emit('vfx_block', this.x, this.y)
      }
    }
  }

  stomp(player) {
    if (this.state === 'walking') {
      this.state = 'shell_still'
      this._walkTween?.stop()
      this.setAngle(0)
      this.setDisplaySize(36, 30)
      this.body.setSize(32, 26)
      this.body.setVelocityX(0)
      player.body.setVelocityY(-380)
      audio.play('stomp')
      this.scene.events.emit('addScore', 100)
      this.scene.events.emit('vfx_stomp', this.x, this.y, 0x22dd44)
    } else if (this.state === 'shell_still') {
      this.kickShell(player)
    } else if (this.state === 'shell_moving') {
      this.state = 'shell_still'
      this.body.setVelocityX(0)
      player.body.setVelocityY(-380)
    }
  }

  touchPlayer(player) {
    if (this.state === 'shell_still') {
      this.kickShell(player)
    } else {
      player.takeDamage()
    }
  }

  kickShell(player) {
    this.state = 'shell_moving'
    const dir = player.x < this.x ? 1 : -1
    this.body.setVelocityX(dir * 450)
    audio.play('shell')
    this.scene.events.emit('addScore', 400)
  }
}
