import { audio } from '../main.js'
import { PLAYER_SIZE } from '../utils/GameData.js'

export class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, charIdx) {
    super(scene, x, y, `player_small_${charIdx}`)
    scene.add.existing(this)
    scene.physics.add.existing(this)

    this.charIdx = charIdx
    this.powerState = 'small'

    // 物理設定
    this.body.setSize(PLAYER_SIZE - 6, PLAYER_SIZE - 4)
    this.body.setMaxVelocityX(300)
    this.setDepth(10)

    // 移動パラメータ
    this.WALK_SPEED = 260
    this.ACCEL = 1400
    this.DRAG = 900

    // ジャンプパラメータ
    this.JUMP_VEL = -690
    this.COYOTE_TIME = 0.12
    this.JUMP_BUFFER = 0.12
    this.FALL_MULTI = 1.8
    this.LOW_JUMP_MULTI = 2.8

    // タイマー
    this._coyote = 0
    this._buffer = 0
    this._invTimer = 0
    this._blinkTimer = 0

    // 状態
    this.isGrounded = false
    this.isInvulnerable = false
    this.isDead = false

    // キー入力
    this.keys = scene.input.keyboard.addKeys({
      left:  Phaser.Input.Keyboard.KeyCodes.LEFT,
      right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      jump:  Phaser.Input.Keyboard.KeyCodes.UP,
      jumpB: Phaser.Input.Keyboard.KeyCodes.SPACE,
      a:     Phaser.Input.Keyboard.KeyCodes.A,
      d:     Phaser.Input.Keyboard.KeyCodes.D
    })

    // モバイルタッチ状態（UIScene から注入）
    this.touch = { left: false, right: false, jump: false }
  }

  get wantsLeft()  { return this.keys.left.isDown  || this.keys.a.isDown    || this.touch.left }
  get wantsRight() { return this.keys.right.isDown || this.keys.d.isDown    || this.touch.right }
  get wantsJump()  { return this.keys.jump.isDown  || this.keys.jumpB.isDown || this.touch.jump }

  update(dt) {
    if (this.isDead) {
      this.angle += 8  // 回転しながら落下
      return
    }

    this._updateTimers(dt)
    this._applyMovement(dt)
    this._applyJump()
    this._applyFallPhysics()
    this._updateBlink(dt)
  }

  _updateTimers(dt) {
    const onGround = this.body.blocked.down

    // 着地した瞬間のスカッシュ演出
    if (onGround && !this.isGrounded) {
      this.scene.tweens.killTweensOf(this)
      this.scene.tweens.add({
        targets: this,
        scaleX: 1.35,
        scaleY: 0.68,
        duration: 65,
        yoyo: true,
        ease: 'Quad.Out'
      })
      if (this.body.velocity.y > 200) {
        this.scene.events.emit('vfx_landing', this.x, this.body.bottom)
      }
    }

    // ジャンプした瞬間のストレッチ演出（縦に伸びる）
    if (!onGround && this.isGrounded && this.body.velocity.y < 0) {
      this.scene.tweens.killTweensOf(this)
      this.scene.tweens.add({
        targets: this,
        scaleX: 0.75,
        scaleY: 1.3,
        duration: 80,
        yoyo: true,
        ease: 'Quad.Out'
      })
    }

    if (onGround) this._coyote = this.COYOTE_TIME
    if (!onGround) this._coyote -= dt
    this.isGrounded = onGround

    if (this._buffer > 0) this._buffer -= dt

    if (this._invTimer > 0) {
      this._invTimer -= dt
      if (this._invTimer <= 0) {
        this.isInvulnerable = false
        this.setAlpha(1)
        this.setScale(1)
      }
    }
  }

  _applyMovement(dt) {
    const body = this.body

    if (this.wantsLeft) {
      body.setAccelerationX(-this.ACCEL)
      this.setFlipX(true)
    } else if (this.wantsRight) {
      body.setAccelerationX(this.ACCEL)
      this.setFlipX(false)
    } else {
      body.setAccelerationX(0)
      const drag = Math.sign(body.velocity.x) * Math.min(this.DRAG * dt * 60, Math.abs(body.velocity.x))
      body.setVelocityX(body.velocity.x - drag)
    }

    if (Math.abs(body.velocity.x) > this.WALK_SPEED) {
      body.setVelocityX(Math.sign(body.velocity.x) * this.WALK_SPEED)
    }
  }

  _applyJump() {
    const body = this.body

    if (Phaser.Input.Keyboard.JustDown(this.keys.jump) ||
        Phaser.Input.Keyboard.JustDown(this.keys.jumpB) ||
        this._jumpJustPressed) {
      this._buffer = this.JUMP_BUFFER
      this._jumpJustPressed = false
    }

    if (this._buffer > 0 && this._coyote > 0) {
      body.setVelocityY(this.JUMP_VEL)
      this._coyote = 0
      this._buffer = 0
      audio.play('jump')
    }
  }

  _applyFallPhysics() {
    const vy = this.body.velocity.y
    const gravity = this.scene.physics.world.gravity.y

    if (vy > 0) {
      this.body.setAccelerationY(gravity * (this.FALL_MULTI - 1))
    } else if (vy < 0 && !this.wantsJump) {
      this.body.setAccelerationY(gravity * (this.LOW_JUMP_MULTI - 1))
    } else {
      this.body.setAccelerationY(0)
    }
  }

  _updateBlink(dt) {
    if (!this.isInvulnerable) return
    this._blinkTimer += dt
    this.setAlpha(Math.sin(this._blinkTimer * 30) > 0 ? 1 : 0.3)
  }

  triggerJump() { this._jumpJustPressed = true }

  grow() {
    if (this.powerState === 'big') return
    this.powerState = 'big'
    this.setTexture(`player_big_${this.charIdx}`)
    this.body.setSize(PLAYER_SIZE - 6 + 12, PLAYER_SIZE - 4 + 12)
    audio.play('powerup')
    // パワーアップのスケールポップ
    this.scene.tweens.add({
      targets: this,
      scaleX: { from: 0.6, to: 1 },
      scaleY: { from: 1.6, to: 1 },
      duration: 200,
      ease: 'Back.Out'
    })
    this.scene.events.emit('playerGrow')
  }

  takeDamage() {
    if (this.isInvulnerable || this.isDead) return
    this.scene.events.emit('vfx_damage')  // 画面シェイク+赤フラッシュ
    if (this.powerState === 'big') {
      this.powerState = 'small'
      this.setTexture(`player_small_${this.charIdx}`)
      this.body.setSize(PLAYER_SIZE - 6, PLAYER_SIZE - 4)
      this.isInvulnerable = true
      this._invTimer = 2.0
      audio.play('damage')
    } else {
      this.die()
    }
  }

  die() {
    if (this.isDead) return
    this.isDead = true
    audio.stopBGM()
    audio.play('death')
    this.body.setVelocity(0, -500)
    this.body.setAcceleration(0)
    this.body.setGravityY(-2600 + 1200)
    this.body.checkCollision.none = true
    this.scene.events.emit('playerDead')
  }
}
