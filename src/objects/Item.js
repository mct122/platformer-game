import { audio } from '../main.js'

export class Mushroom extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'mushroom')
    scene.add.existing(this)
    scene.physics.add.existing(this)
    this.setDisplaySize(28, 28)
    this.body.setSize(26, 26)
    this.setDepth(5)
    this.body.setVelocityX(80)
    this.collected = false
  }

  update() {
    if (this.body.blocked.left)  this.body.setVelocityX(80)
    if (this.body.blocked.right) this.body.setVelocityX(-80)
  }

  collect(player) {
    if (this.collected) return
    this.collected = true
    player.grow()
    this.scene.events.emit('addScore', 1000)
    this.destroy()
  }
}
