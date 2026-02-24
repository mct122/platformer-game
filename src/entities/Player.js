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
    this.COYOTE_TIME = 0.12   // 崖端猶予（秒）
    this.JUMP_BUFFER = 0.12   // 先行入力猶予（秒）
    this.FALL_MULTI = 1.8     // 落下加速倍率
    this.LOW_JUMP_MULTI = 2.8 // 早離し減衰倍率

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
      // 死亡アニメーション（回転しながら落下）
      this.angle += 8
      return
    }

    this._updateTimers(dt)
    this._applyMovement(dt)
    this._applyJump()
    this._applyFallPhysics()
    this._updateBlink(dt)
  }

  _updateTimers(dt) {
    // 着地確認
    const onGround = this.body.blocked.down
    if (onGround && !this.isGrounded) this._coyote = this.COYOTE_TIME
    if (onGround) this._coyote = this.COYOTE_TIME
    if (!onGround) this._coyote -= dt
    this.isGrounded = onGround

    // ジャンプ先行入力
    if (this._buffer > 0) this._buffer -= dt

    // 無敵タイマー
    if (this._invTimer > 0) {
      this._invTimer -= dt
      if (this._invTimer <= 0) {
        this.isInvulnerable = false
        this.setAlpha(1)
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
      // 摩擦で自然減速
      const drag = Math.sign(body.velocity.x) * Math.min(this.DRAG * dt * 60, Math.abs(body.velocity.x))
      body.setVelocityX(body.velocity.x - drag)
    }

    // 最大速度クランプ
    if (Math.abs(body.velocity.x) > this.WALK_SPEED) {
      body.setVelocityX(Math.sign(body.velocity.x) * this.WALK_SPEED)
    }
  }

  _applyJump() {
    const body = this.body

    // ジャンプ先行入力を記録
    if (Phaser.Input.Keyboard.JustDown(this.keys.jump) ||
        Phaser.Input.Keyboard.JustDown(this.keys.jumpB) ||
        this._jumpJustPressed) {
      this._buffer = this.JUMP_BUFFER
      this._jumpJustPressed = false
    }

    // コヨーテタイム内かつバッファあればジャンプ
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
      // 落下を重くして着地感を出す
      this.body.setAccelerationY(gravity * (this.FALL_MULTI - 1))
    } else if (vy < 0 && !this.wantsJump) {
      // ジャンプボタンを早く離すと上昇が弱まる
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

  // モバイルからジャンプ入力を受け取る
  triggerJump() { this._jumpJustPressed = true }

  grow() {
    if (this.powerState === 'big') return
    this.powerState = 'big'
    this.setTexture(`player_big_${this.charIdx}`)
    this.body.setSize(PLAYER_SIZE - 6 + 12, PLAYER_SIZE - 4 + 12)
    audio.play('powerup')
    this.scene.events.emit('playerGrow')
  }

  takeDamage() {
    if (this.isInvulnerable || this.isDead) return
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
    this.body.setGravityY(-2600 + 1200) // 少し重力弱めて弧を描く
    this.body.checkCollision.none = true
    this.scene.events.emit('playerDead')
  }
}
