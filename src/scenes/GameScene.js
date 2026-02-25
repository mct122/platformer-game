import { Player } from '../entities/Player.js'
import { Goomba } from '../entities/Goomba.js'
import { Koopa } from '../entities/Koopa.js'
import { QuestionBlock } from '../objects/QuestionBlock.js'
import { Mushroom } from '../objects/Item.js'
import { audio } from '../main.js'
import { MAP_WIDTH, CHARACTERS } from '../utils/GameData.js'

const GH = 540       // canvas height
const GY = GH - 64  // 地面Y (top of ground)
const TS = 32        // tile size

export class GameScene extends Phaser.Scene {
  constructor() { super('GameScene') }

  create() {
    this.score = 0
    this.coins = 0
    this.lives = this.registry.get('lives') ?? 3
    this._dead = false
    this._comboCount = 0   // 連続踏みコンボ

    // 背景グラデーション
    this._buildBackground()

    // --- レベル構築 ---
    this._buildLevel()

    // --- プレイヤー ---
    const charIdx = this.registry.get('charIndex') ?? 0
    this.player = new Player(this, 100, GY - 55, charIdx)

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
    // VFX イベント
    this.events.on('vfx_stomp',   (x, y, c) => this._fxStomp(x, y, c))
    this.events.on('vfx_landing', (x, y)    => { this._fxDust(x, y, 6); this._comboCount = 0 })
    this.events.on('vfx_damage',  ()         => { this._fxDamageShake(); this._comboCount = 0 })
    this.events.on('vfx_block',   (x, y)    => this._fxBlock(x, y))

    // ゴールフラグ
    this._buildGoal()

    // BGM
    audio.startBGM()

    // HUD 初期化
    this._emitHUD()

    // フェードイン
    this.cameras.main.fadeIn(400)
  }

  // =====================================================
  //  背景レイヤー
  // =====================================================
  _buildBackground() {
    // 空グラデーション
    const bg = this.add.graphics().setScrollFactor(0)
    bg.fillGradientStyle(0x5bc8f5, 0x5bc8f5, 0xa8e6ff, 0xa8e6ff, 1)
    bg.fillRect(0, 0, 960, GH)

    // 丘（遠景パララックス 0.15倍）
    const hillPositions = [0, 600, 1400, 2200, 3000, 3800, 4600, 5400]
    hillPositions.forEach(hx => {
      this.add.image(hx + 100, GY - 10, 'hill')
        .setOrigin(0, 1)
        .setScrollFactor(0.15)
        .setDepth(-2)
      this.add.image(hx + 320, GY - 10, 'hill')
        .setOrigin(0, 1)
        .setScrollFactor(0.15)
        .setDepth(-2)
        .setScale(0.7)
    })

    // 雲（中景パララックス 0.35倍）
    const cloudY = [60, 100, 80, 120, 70, 90]
    const cloudX = [120, 400, 750, 1100, 1500, 1900, 2400, 2900, 3400, 3900, 4500, 5100, 5700]
    cloudX.forEach((cx, i) => {
      this.add.image(cx, cloudY[i % cloudY.length], 'cloud')
        .setScrollFactor(0.35)
        .setDepth(-1)
        .setAlpha(0.9)
    })
  }

  // =====================================================
  //  レベル構築
  // =====================================================
  _buildLevel() {
    // 地面セグメント（穴あき）
    this.ground = this.physics.add.staticGroup()
    const groundSegs = [
      [0,    2560],
      [2688, 4480],
      [4608, MAP_WIDTH]
    ]
    groundSegs.forEach(([sx, ex]) => {
      this._buildGroundSegment(sx, ex)
    })

    // 浮き足場
    this.platforms = this.physics.add.staticGroup()
    const pfList = [
      [480,  GY - 96,  3],   // 3タイル幅
      [700,  GY - 128, 4],
      [900,  GY - 192, 2],
      [1100, GY - 96,  4],
      [1350, GY - 160, 3],
      [1600, GY - 96,  5],
      [1900, GY - 128, 3],
      [2100, GY - 192, 3],
      [2200, GY - 96,  4],
      [2850, GY - 96,  4],
      [3100, GY - 160, 3],
      [3400, GY - 96,  6],
      [3700, GY - 128, 4],
      [3900, GY - 192, 3],
      [4150, GY - 96,  5],
      [4750, GY - 96,  4],
      [5000, GY - 160, 3],
      [5300, GY - 96,  6],
      [5600, GY - 128, 4],
      // 終盤の階段
      [5950, GY - 64,  3],
      [5950, GY - 96,  2],
      [5950, GY - 128, 1],
    ]
    pfList.forEach(([x, y, tiles]) => this._addPlatform(x, y, tiles))

    // パイプ（装飾 + 衝突あり）
    const pipeList = [
      [320,  2],  // [x, 高さ(タイル数)]
      [820,  3],
      [1800, 2],
      [2450, 4],
      [3250, 2],
      [4900, 3],
      [5150, 2],
    ]
    pipeList.forEach(([px, ph]) => this._addPipe(px, ph))

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
      // 序盤（遅め・通常）
      { type: 'goomba', x: 600,  y: GY },
      { type: 'goomba', x: 900,  y: GY },
      { type: 'koopa',  x: 1250, y: GY },
      { type: 'goomba', x: 1500, y: GY },
      { type: 'goomba', x: 1700, y: GY },
      // 足場上に配置
      { type: 'goomba', x: 720,  y: GY - 128 },
      { type: 'goomba', x: 1120, y: GY - 96  },
      // 中盤
      { type: 'koopa',  x: 2000, y: GY },
      { type: 'goomba', x: 2300, y: GY },
      { type: 'goomba', x: 2800, y: GY },
      { type: 'koopa',  x: 3200, y: GY },
      { type: 'goomba', x: 3500, y: GY },
      { type: 'goomba', x: 3600, y: GY },
      // 足場上
      { type: 'koopa',  x: 3430, y: GY - 96  },
      // 終盤（速め）
      { type: 'koopa',  x: 3900, y: GY },
      { type: 'goomba', x: 4200, y: GY, speed: 90 },
      { type: 'goomba', x: 4700, y: GY, speed: 90 },
      { type: 'koopa',  x: 5000, y: GY },
      { type: 'goomba', x: 5400, y: GY, speed: 110 },
      { type: 'goomba', x: 5700, y: GY, speed: 110 },
      { type: 'koopa',  x: 5900, y: GY },
    ]
    this._goombaList = []
    this._koopaList  = []
    enemyList.forEach(({ type, x, y, speed }) => {
      if (type === 'goomba') {
        const g = new Goomba(this, x, y - 18, speed)
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

  /** 地面セグメントをタイルで描画 */
  _buildGroundSegment(sx, ex) {
    const w = ex - sx
    const tileW = Math.ceil(w / TS)

    // 一番上の行：草付きタイル
    this.add.tileSprite(sx, GY, w, TS, 'tile_ground').setOrigin(0, 0)

    // 下の2行：土タイル
    this.add.tileSprite(sx, GY + TS, w, TS * 2, 'tile_soil').setOrigin(0, 0)

    // 物理ボディ（地面全体）
    const rect = this.add.rectangle(sx + w / 2, GY + TS, w, TS * 3)
    this.physics.add.existing(rect, true)
    this.ground.add(rect)
  }

  /** 足場をレンガタイルで描画 */
  _addPlatform(x, y, tiles) {
    const w = tiles * TS
    this.add.tileSprite(x, y, w, TS, 'tile_brick').setOrigin(0, 0)

    const rect = this.add.rectangle(x + w / 2, y + TS / 2, w, TS)
    this.physics.add.existing(rect, true)
    this.platforms.add(rect)
  }

  /** パイプを配置（ビジュアル + 物理ボディ） */
  _addPipe(x, heightTiles) {
    const pipeW = 64
    const bodyH = (heightTiles - 1) * TS
    const baseY = GY  // 地面の上端

    // パイプ胴体
    if (bodyH > 0) {
      this.add.tileSprite(x, baseY - bodyH, pipeW, bodyH, 'tile_pipe_body').setOrigin(0, 0)
    }

    // パイプ口（頭）
    this.add.image(x + pipeW / 2, baseY - bodyH - TS / 2 - 2, 'tile_pipe_head').setDepth(1)

    // 物理ボディ
    const totalH = heightTiles * TS
    const rect = this.add.rectangle(x + pipeW / 2, baseY - totalH / 2, pipeW, totalH)
    this.physics.add.existing(rect, true)
    this.platforms.add(rect)
  }

  _buildGoal() {
    this.goalX = MAP_WIDTH - 200

    // 旗ポール
    this.add.rectangle(this.goalX, GY - 150, 6, 300, 0xcccccc)
    // 旗
    const flag = this.add.triangle(
      this.goalX + 3, GY - 295,
      this.goalX + 3, GY - 295,
      this.goalX + 45, GY - 275,
      this.goalX + 3, GY - 255,
      0xff2020
    )
    // GOAL テキスト
    this.add.text(this.goalX - 10, GY - 330, 'GOAL', {
      fontFamily: 'monospace', fontSize: '20px', color: '#ffffff',
      stroke: '#000000', strokeThickness: 4
    }).setOrigin(0.5)

    // 台座
    this.add.rectangle(this.goalX, GY + 16, 24, 40, 0xaaaaaa)

    // ゴール判定ゾーン
    this.goalZone = this.add.zone(this.goalX, GY - 150, 60, 300)
    this.physics.world.enable(this.goalZone)
    this.goalZone.body.setAllowGravity(false)
  }

  // =====================================================
  //  衝突処理
  // =====================================================
  _onPlayerEnemyOverlap(player, enemy) {
    if (player.isDead || enemy.isDead) return

    const stomping = player.body.velocity.y > 0 &&
                     player.body.bottom < enemy.body.top + 24

    if (stomping) {
      this._comboCount++
      enemy.stomp(player)
      // コンボボーナス（2連続目から）
      if (this._comboCount > 1) {
        const bonus = Math.min(this._comboCount, 8) * 100
        this._addScore(bonus, enemy.x, enemy.y - 30, '#ff8800')
        this._showComboText(enemy.x, enemy.y)
        audio.play('combo')
      }
    } else {
      this._comboCount = 0
      enemy.touchPlayer(player)
    }
  }

  _showComboText(x, y) {
    const label = this._comboCount >= 5 ? '🔥 COMBO x' + this._comboCount
                : 'COMBO x' + this._comboCount
    const t = this.add.text(x, y - 50, label, {
      fontFamily: '"Orbitron", monospace', fontSize: '16px',
      color: '#ff8800', stroke: '#000', strokeThickness: 4
    }).setDepth(25)
    this.tweens.add({ targets: t, y: t.y - 40, alpha: 0, duration: 900, onComplete: () => t.destroy() })
  }

  _onPlayerBlockCollide(player, block) {
    if (player.body.velocity.y < 0 && player.body.top < block.body.bottom) {
      block.hitFromBelow(player)
    }
  }

  // =====================================================
  //  メインループ
  // =====================================================
  update(time, delta) {
    const dt = delta / 1000
    if (this._dead) return

    this.player.update(dt)

    this._goombaList.forEach(g => { if (g.active) g.update(dt) })
    this._koopaList.forEach(k => { if (k.active) k.update(dt) })

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

  // =====================================================
  //  スコア / HUD
  // =====================================================
  _addScore(v, tx, ty, color = '#ffe000') {
    this.score += v
    this._emitHUD()
    // フローティングスコアテキスト
    const x = tx ?? this.player.x
    const y = ty ?? (this.player.y - 30)
    const t = this.add.text(x, y, `+${v}`, {
      fontFamily: '"Orbitron", monospace', fontSize: '14px', color,
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

  // =====================================================
  //  VFX ヘルパー
  // =====================================================
  _fxStomp(x, y, tint = 0xffcc00) {
    try {
      const e = this.add.particles(x, y, 'particle_star', {
        speed: { min: 80, max: 220 },
        angle: { min: 190, max: 350 },
        scale: { start: 1, end: 0 },
        tint,
        lifespan: 550,
        quantity: 12,
        gravityY: 500,
        emitting: false,
        depth: 30
      })
      e.explode(12)
      this.time.delayedCall(650, () => e.destroy())
    } catch (_) {}
  }

  _fxDust(x, y, count = 6) {
    try {
      const e = this.add.particles(x, y, 'particle_dust', {
        speed: { min: 20, max: 80 },
        angle: { min: 190, max: 350 },
        scale: { start: 0.8, end: 0 },
        lifespan: 350,
        quantity: count,
        gravityY: 150,
        emitting: false,
        depth: 25
      })
      e.explode(count)
      this.time.delayedCall(450, () => e.destroy())
    } catch (_) {}
  }

  _fxBlock(x, y) {
    try {
      const e = this.add.particles(x, y - 16, 'particle_spark', {
        speed: { min: 40, max: 140 },
        angle: { min: 200, max: 340 },
        scale: { start: 0.9, end: 0 },
        tint: 0xffd700,
        lifespan: 400,
        quantity: 8,
        gravityY: 300,
        emitting: false,
        depth: 25
      })
      e.explode(8)
      this.time.delayedCall(500, () => e.destroy())
    } catch (_) {}
  }

  _fxDamageShake() {
    this.cameras.main.shake(250, 0.006)
    // 画面を一瞬赤くフラッシュ
    const flash = this.add.rectangle(480, 270, 960, 540, 0xff0000, 0.35)
      .setScrollFactor(0).setDepth(50)
    this.tweens.add({ targets: flash, alpha: 0, duration: 250, onComplete: () => flash.destroy() })
  }

  // =====================================================
  //  死亡 / クリア
  // =====================================================
  _onDeath() {
    if (this._dead) return
    this._dead = true
    this.lives--
    this.registry.set('lives', this.lives)

    this.time.delayedCall(2000, () => {
      audio.stopBGM()
      this.cameras.main.fadeOut(500)
      this.cameras.main.once('camerafadeoutcomplete', () => {
        if (this.lives <= 0) {
          this.registry.set('lives', 3)
          this.registry.set('lastScore', this.score)
          this.scene.stop('UIScene')
          this.scene.start('GameOverScene', { score: this.score })
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

    // タイムボーナス算出（仮: スコア×0.1 まるめ）
    const timeBonus = Math.floor(this.score * 0.1 / 50) * 50
    this.registry.set('lastScore', this.score + timeBonus)

    this.cameras.main.fadeOut(1200, 255, 255, 255)
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.stop('UIScene')
      this.scene.start('StageClearScene', { score: this.score, timeBonus })
    })
  }
}
