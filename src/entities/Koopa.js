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
    this.state = 'walking' // walking | shell_still | shell_moving
    this.speed = 45
    this.isDead = false
    this.body.setVelocityX(-this.speed)
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
      }
    }
  }

  stomp(player) {
    if (this.state === 'walking') {
      this.state = 'shell_still'
      this.setDisplaySize(36, 30)
      this.body.setSize(32, 26)
      this.body.setVelocityX(0)
      player.body.setVelocityY(-380)
      audio.play('stomp')
      this.scene.events.emit('addScore', 100)
    } else if (this.state === 'shell_still') {
      this.kickShell(player)
    } else if (this.state === 'shell_moving') {
      // 動いてる甲羅の上に乗ったら停止
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
    audio.play('stomp')
    this.scene.events.emit('addScore', 400)
  }
}
