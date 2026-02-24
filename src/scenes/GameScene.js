import { Player } from '../entities/Player.js'
import { Goomba } from '../entities/Goomba.js'
import { Koopa } from '../entities/Koopa.js'
import { QuestionBlock } from '../objects/QuestionBlock.js'
import { Mushroom } from '../objects/Item.js'
import { audio } from '../main.js'
import { MAP_WIDTH } from '../utils/GameData.js'

const GH = 540       // canvas height
const GY = GH - 64  // 地面Y (top of ground)
const TS = 32        // tile size

export class GameScene extends Phaser.Scene {
  constructor() { super('GameScene') }

  create() {
    this.score = 0
    this.coins = 0
    this.lives = 3
    this._dead = false

    // 背景（パララックス）
    this.bg = this.add.tileSprite(0, 0, MAP_WIDTH, GH, 'sky')
      .setOrigin(0).setScrollFactor(0)

    // --- レベル構築 ---
    this._buildLevel()

    // --- プレイヤー ---
    const charIdx = this.registry.get('charIndex') ?? 0
    this.player = new Player(this, 100, GY - 50, charIdx)

    // --- 衝突設定 ---
    this.physics.add.collider(this.player, this.ground)
    this.physics.add.collider(this.player, this.platforms)
    this.physics.add.collider(this.enemies, this.ground)
    this.physics.add.collider(this.enemies, this.platforms)
    this.physics.add.collider(this.mushrooms, this.ground)
    this.physics.add.collider(this.mushrooms, this.platforms)

    // プレイヤー vs 敵
    this.physics.add.overlap(this.player, this.enemies, this._onPlayerEnemyOverlap, null, this)
    // プレイヤー vs ?ブロック（頭突き）
    this.physics.add.collider(this.player, this.qblocks, this._onPlayerBlockCollide, null, this)
    // プレイヤー vs キノコ
    this.physics.add.overlap(this.player, this.mushrooms, (p, m) => m.collect(p), null, this)

    // --- カメラ ---
    this.cameras.main.setBounds(0, 0, MAP_WIDTH, GH)
    this.cameras.main.startFollow(this.player, true, 0.1, 1)
    this.cameras.main.setDeadzone(120, 40)

    // --- イベント ---
    this.events.on('addScore', v => this._addScore(v))
    this.events.on('addCoin', () => { this.coins++; audio.play('coin'); this._addScore(200); this._emitHUD() })
    this.events.on('spawnMushroom', (x, y) => { this.mushrooms.add(new Mushroom(this, x, y), true) })
    this.events.on('playerDead', () => this._onDeath())
    this.events.on('playerGrow', () => this._emitHUD())

    // ゴールフラグ
    this._buildGoal()

    // BGM
    audio.startBGM()

    // HUD 初期化
    this._emitHUD()

    // フェードイン
    this.cameras.main.fadeIn(400)
  }

  _buildLevel() {
    // 地面セグメント（穴あき）
    this.ground = this.physics.add.staticGroup()
    const segs = [
      [0,     2560],  // seg1
      [2688,  4480],  // seg2（穴 2560-2688）
      [4608,  MAP_WIDTH] // seg3（穴 4480-4608）
    ]
    segs.forEach(([sx, ex]) => {
      const w = ex - sx
      // タイルビジュアル
      this.add.tileSprite(sx, GY + 16, w, TS * 2, '__DEFAULT').setOrigin(0, 0)
        .setTint(0x8B4513)
      // 物理ボディ
      const rect = this.add.rectangle(sx + w / 2, GY + TS, w, TS * 2, 0x8B4513)
      this.physics.add.existing(rect, true)
      this.ground.add(rect)
    })

    // 浮き足場
    this.platforms = this.physics.add.staticGroup()
    const pfList = [
      // [x_left, y_top, width]
      [480,  GY - 96,  96],
      [700,  GY - 128, 128],
      [900,  GY - 192, 64],
      [1100, GY - 96,  128],
      [1350, GY - 160, 96],
      [1600, GY - 96,  160],
      [1900, GY - 128, 96],
      [2100, GY - 192, 96],
      [2200, GY - 96,  128],
      [2850, GY - 96,  128],
      [3100, GY - 160, 96],
      [3400, GY - 96,  192],
      [3700, GY - 128, 128],
      [3900, GY - 192, 96],
      [4150, GY - 96,  160],
      [4750, GY - 96,  128],
      [5000, GY - 160, 96],
      [5300, GY - 96,  192],
      [5600, GY - 128, 128],
    ]
    pfList.forEach(([x, y, w]) => this._addPlatform(x, y, w))

    // ?ブロック
    this.qblocks = this.physics.add.staticGroup()
    const qbList = [
      [500,  GY - 128, 'mushroom'],
      [700,  GY - 160, 'coin'],
      [732,  GY - 160, 'coin'],
      [764,  GY - 160, 'coin'],
      [900,  GY - 224, 'coin'],
      [1100, GY - 128, 'mushroom'],
      [1600, GY - 128, 'coin'],
      [2100, GY - 224, 'coin'],
      [2900, GY - 128, 'mushroom'],
      [3450, GY - 128, 'coin'],
      [3482, GY - 128, 'coin'],
      [4800, GY - 128, 'mushroom'],
      [5350, GY - 128, 'coin'],
    ]
    qbList.forEach(([x, y, c]) => {
      const qb = new QuestionBlock(this, x + 16, y, c)
      this.qblocks.add(qb)
    })

    // 敵
    this.enemies = this.physics.add.group({ classType: Phaser.Physics.Arcade.Sprite, runChildUpdate: false })
    const enemyList = [
      { type: 'goomba', x: 600,  y: GY },
      { type: 'goomba', x: 900,  y: GY },
      { type: 'koopa',  x: 1250, y: GY },
      { type: 'goomba', x: 1500, y: GY },
      { type: 'goomba', x: 1700, y: GY },
      { type: 'koopa',  x: 2000, y: GY },
      { type: 'goomba', x: 2300, y: GY },
      { type: 'goomba', x: 2800, y: GY },
      { type: 'koopa',  x: 3200, y: GY },
      { type: 'goomba', x: 3500, y: GY },
      { type: 'goomba', x: 3600, y: GY },
      { type: 'koopa',  x: 3900, y: GY },
      { type: 'goomba', x: 4200, y: GY },
      { type: 'goomba', x: 4700, y: GY },
      { type: 'koopa',  x: 5000, y: GY },
      { type: 'goomba', x: 5400, y: GY },
      { type: 'goomba', x: 5700, y: GY },
      { type: 'koopa',  x: 5900, y: GY },
    ]
    this._goombaList = []
    this._koopaList = []
    enemyList.forEach(({ type, x, y }) => {
      if (type === 'goomba') {
        const g = new Goomba(this, x, y - 18)
        this.enemies.add(g)
        this._goombaList.push(g)
      } else {
        const k = new Koopa(this, x, y - 24)
        this.enemies.add(k)
        this._koopaList.push(k)
      }
    })

    // キノコ
    this.mushrooms = this.physics.add.group({ runChildUpdate: true })
  }

  _addPlatform(x, y, w) {
    const rect = this.add.rectangle(x + w / 2, y + TS / 2, w, TS, 0x5c8a32)
      .setStrokeStyle(2, 0x3a5c20)
    this.physics.add.existing(rect, true)
    this.platforms.add(rect)
  }

  _buildGoal() {
    this.goalX = MAP_WIDTH - 200
    // 旗ポール
    this.add.rectangle(this.goalX, GY - 150, 8, 300, 0xdddddd)
    this.add.rectangle(this.goalX + 34, GY - 285, 60, 28, 0xff0000)
    this.add.text(this.goalX - 40, GY - 320, 'GOAL', {
      fontFamily: 'monospace', fontSize: '20px', color: '#ffffff',
      stroke: '#000000', strokeThickness: 4
    })
    // ゴール判定用透明ゾーン
    this.goalZone = this.add.zone(this.goalX, GY - 150, 60, 300)
    this.physics.world.enable(this.goalZone)
    this.goalZone.body.setAllowGravity(false)
  }

  // プレイヤーと敵の衝突処理
  _onPlayerEnemyOverlap(player, enemy) {
    if (player.isDead) return
    const isGoomba = enemy instanceof Goomba
    const isKoopa  = enemy instanceof Koopa
    if (enemy.isDead) return

    // 踏みつけ判定: プレイヤーが下降中 かつ 敵より上にいる
    const stomping = player.body.velocity.y > 50 &&
                     player.body.bottom < enemy.body.top + 20

    if (stomping) {
      if (isGoomba) enemy.stomp(player)
      if (isKoopa)  enemy.stomp(player)
    } else {
      if (isGoomba) enemy.touchPlayer(player)
      if (isKoopa)  enemy.touchPlayer(player)
    }
  }

  // プレイヤーがブロックに衝突
  _onPlayerBlockCollide(player, block) {
    // プレイヤーが下から当たった（頭突き）
    if (player.body.velocity.y < 0 && player.body.top < block.body.bottom) {
      block.hitFromBelow(player)
    }
  }

  update(time, delta) {
    const dt = delta / 1000
    if (this._dead) return

    this.player.update(dt)

    // 各敵を更新
    this._goombaList.forEach(g => { if (g.active) g.update(dt) })
    this._koopaList.forEach(k => { if (k.active) k.update(dt) })

    // パララックス背景
    this.bg.tilePositionX = this.cameras.main.scrollX * 0.3

    // 穴落下判定
    if (this.player.y > GH + 100 && !this.player.isDead) {
      this.player.die()
    }

    // ゴール判定
    if (!this._dead && this.player.x > this.goalX - 30) {
      this._onClear()
    }

    // HUD 更新
    this.events.emit('updateHUD', {
      score: this.score, coins: this.coins, lives: this.lives,
      x: this.player.x, goalX: this.goalX
    })
  }

  _addScore(v) {
    this.score += v
    this._emitHUD()
    // フローティングスコアテキスト
    const t = this.add.text(this.player.x, this.player.y - 30, `+${v}`, {
      fontFamily: 'monospace', fontSize: '14px', color: '#ffe000',
      stroke: '#000', strokeThickness: 3
    }).setDepth(20)
    this.tweens.add({ targets: t, y: t.y - 50, alpha: 0, duration: 700, onComplete: () => t.destroy() })
  }

  _emitHUD() {
    this.events.emit('updateHUD', {
      score: this.score, coins: this.coins, lives: this.lives,
      x: this.player.x, goalX: this.goalX
    })
  }

  _onDeath() {
    if (this._dead) return
    this._dead = true
    this.lives--
    this.time.delayedCall(2000, () => {
      audio.stopBGM()
      this.cameras.main.fadeOut(500)
      this.cameras.main.once('camerafadeoutcomplete', () => {
        if (this.lives <= 0) {
          this.scene.stop('UIScene')
          this.scene.start('TitleScene')
        } else {
          this._dead = false
          this.scene.restart()
        }
      })
    })
  }

  _onClear() {
    if (this._dead) return
    this._dead = true
    audio.stopBGM()
    audio.play('clear')
    this.cameras.main.fadeOut(1200, 255, 255, 255)
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.stop('UIScene')
      this.scene.start('TitleScene')
    })
  }
}
