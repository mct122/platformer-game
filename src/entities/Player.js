import { audio } from '../main.js'
import { PLAYER_SIZE, CHARACTERS } from '../utils/GameData.js'

export class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, charIdx) {
    super(scene, x, y, `player_small_${charIdx}`)
    scene.add.existing(this)
    scene.physics.add.existing(this)

    this.charIdx = charIdx
    this.powerState = 'small'

    // キャラクター固有ステータス
    const s = CHARACTERS[charIdx]?.stats ?? CHARACTERS[0].stats

    // 表示サイズ（ポートレート表示）
    this.DISP_W = 90   // 表示幅
    this.DISP_H = 200  // 表示高さ（元画像の縦長に合わせる）
    this.setDisplaySize(this.DISP_W, this.DISP_H)

    // 物理ボディ（表示より小さく・足元に寄せる）
    const bodyW = 58
    const bodyH = 90
    this.body.setSize(bodyW, bodyH)
    // オフセット: 横中央・縦は下半分（足元）に寄せる
    this.body.setOffset((this.DISP_W - bodyW) / 2, this.DISP_H - bodyH - 10)
    this.body.setMaxVelocityX(s.speed)
    this.setDepth(10)

    // 移動パラメータ
    this.WALK_SPEED = s.speed
    this.ACCEL = s.accel
    this.DRAG = 900

    // ジャンプパラメータ
    this.JUMP_VEL = s.jump
    this.COYOTE_TIME = 0.12
    this.JUMP_BUFFER = 0.12
    this.FALL_MULTI = s.fallMulti
    this.LOW_JUMP_MULTI = 2.8

    // タイマー
    this._coyote = 0
    this._buffer = 0
    this._invTimer = 0
    this._blinkTimer = 0
    this._prevJumpDown = false

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

    // isDown ベースの手動エッジ検出（JustDown の同時押し問題を回避）
    const jumpDown = this.wantsJump
    const justPressed = jumpDown && !this._prevJumpDown
    this._prevJumpDown = jumpDown

    if (justPressed || this._jumpJustPressed) {
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
    const bigW = 110, bigH = 240
    this.setDisplaySize(bigW, bigH)
    const bodyW = 68, bodyH = 110
    this.body.setSize(bodyW, bodyH)
    this.body.setOffset((bigW - bodyW) / 2, bigH - bodyH - 10)
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
      const smallW = this.DISP_W, smallH = this.DISP_H
      this.setDisplaySize(smallW, smallH)
      const bodyW = 58, bodyH = 90
      this.body.setSize(bodyW, bodyH)
      this.body.setOffset((smallW - bodyW) / 2, smallH - bodyH - 10)
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
