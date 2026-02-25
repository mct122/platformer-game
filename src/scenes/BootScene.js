import { CHARACTERS } from '../utils/GameData.js'

export class BootScene extends Phaser.Scene {
  constructor() { super('BootScene') }

  preload() {
    const W = this.scale.width
    const H = this.scale.height

    // 背景
    const bg = this.add.graphics()
    bg.fillGradientStyle(0x0a0a1a, 0x0a0a1a, 0x001033, 0x001033, 1)
    bg.fillRect(0, 0, W, H)

    // タイトル
    this.add.text(W / 2, H / 2 - 80, 'SUPER PLATFORMER', {
      fontFamily: '"Orbitron", monospace',
      fontSize: '32px',
      fontStyle: 'bold',
      color: '#00d4ff',
      stroke: '#003366',
      strokeThickness: 6
    }).setOrigin(0.5)

    // ローディングバー外枠
    const barW = 400
    const barH = 16
    const barX = W / 2 - barW / 2
    const barY = H / 2 + 10
    this.add.rectangle(W / 2, barY + barH / 2, barW + 4, barH + 4, 0x334466)
    const bar = this.add.rectangle(barX, barY, 0, barH, 0x00d4ff).setOrigin(0, 0)

    // パーセント表示
    const pctText = this.add.text(W / 2, barY + barH + 16, '0%', {
      fontFamily: '"Orbitron", monospace',
      fontSize: '12px',
      color: '#aabbff'
    }).setOrigin(0.5, 0)

    this.load.on('progress', v => {
      bar.setSize(v * barW, barH)
      pctText.setText(Math.floor(v * 100) + '%')
    })

    // 背景
    this.load.image('sky', 'assets/sky.png')

    // 敵・アイテム
    this.load.image('enemy', 'assets/enemy.png')
    this.load.image('koopa', 'assets/koopa.png')
    this.load.image('mushroom', 'assets/mushroom.png')

    // キャラクター写真をすべてロード
    CHARACTERS.forEach((c, i) => {
      this.load.image(`char_normal_${i}`, c.normal)
      this.load.image(`char_super_${i}`, c.super)
    })
  }

  create() {
    // タイルテクスチャを生成
    this._makeGroundTile()
    this._makeBrickTile()
    this._makeGrassTile()
    this._makePipeTextures()
    this._makeCloudTexture()
    this._makeHillTexture()
    this._makeParticleTextures()

    // コインテクスチャ
    this._makeCoinTexture()

    // キャラクターのポートレートテクスチャを生成
    // 上半身フォーカス（顔〜胸元）をアバターとして切り出す
    CHARACTERS.forEach((c, i) => {
      this._makePortraitTex(`avatar_${i}`, `char_normal_${i}`, 160, 220)
      this._makePortraitTex(`player_small_${i}`, `char_normal_${i}`, 90, 200)
      this._makePortraitTex(`player_big_${i}`, `char_super_${i}`, 110, 240)
    })
    this.scene.start('TitleScene')
  }

  /** 地面タイル（草付き土ブロック 32×32） */
  _makeGroundTile() {
    const g = this.make.graphics({ add: false })
    // 土ベース
    g.fillStyle(0xb8864e)
    g.fillRect(0, 0, 32, 32)
    // 草の部分（上8px）
    g.fillStyle(0x4caf3c)
    g.fillRect(0, 0, 32, 8)
    // 草ハイライト
    g.fillStyle(0x6dcf56)
    g.fillRect(0, 0, 32, 3)
    // 土のグリッド線
    g.fillStyle(0x9c6a30)
    g.fillRect(0, 20, 32, 1)
    g.fillRect(16, 8, 1, 24)
    // 輪郭
    g.lineStyle(1, 0x000000, 0.25)
    g.strokeRect(0, 0, 32, 32)
    g.generateTexture('tile_ground', 32, 32)
    g.destroy()
  }

  /** レンガタイル（プラットフォーム・ブロック用 32×32） */
  _makeBrickTile() {
    const g = this.make.graphics({ add: false })
    // ベース
    g.fillStyle(0xc85c1a)
    g.fillRect(0, 0, 32, 32)
    // モルタル（目地）
    g.fillStyle(0x8b3a10)
    g.fillRect(0, 15, 32, 2)      // 横目地
    g.fillRect(8, 0, 2, 15)       // 上段縦目地
    g.fillRect(22, 0, 2, 15)      // 上段縦目地2
    g.fillRect(0, 17, 16, 15)     // 下段左
    g.fillRect(18, 17, 14, 15)    // 下段右
    // ハイライト
    g.fillStyle(0xe07030)
    g.fillRect(2, 2, 4, 11)
    g.fillRect(12, 2, 8, 11)
    g.fillRect(24, 2, 6, 11)
    g.fillRect(2, 19, 12, 11)
    g.fillRect(20, 19, 10, 11)
    g.generateTexture('tile_brick', 32, 32)
    g.destroy()
  }

  /** 草ブロック（地面の継続部分、草なし） */
  _makeGrassTile() {
    const g = this.make.graphics({ add: false })
    g.fillStyle(0xb8864e)
    g.fillRect(0, 0, 32, 32)
    g.fillStyle(0x9c6a30)
    g.fillRect(0, 16, 32, 1)
    g.fillRect(16, 0, 1, 32)
    g.lineStyle(1, 0x000000, 0.2)
    g.strokeRect(0, 0, 32, 32)
    g.generateTexture('tile_soil', 32, 32)
    g.destroy()
  }

  /** パイプ用テクスチャ（縦・横） */
  _makePipeTextures() {
    // パイプ胴体（32×32 繰り返し用）
    const body = this.make.graphics({ add: false })
    body.fillStyle(0x2da41c)
    body.fillRect(0, 0, 32, 32)
    body.fillStyle(0x3de828)
    body.fillRect(4, 0, 8, 32)
    body.fillStyle(0x1a7a10)
    body.fillRect(24, 0, 8, 32)
    body.lineStyle(1, 0x000000, 0.3)
    body.strokeRect(0, 0, 32, 32)
    body.generateTexture('tile_pipe_body', 32, 32)
    body.destroy()

    // パイプ口（64×32 = 2タイル幅 × 1タイル高さ）
    const head = this.make.graphics({ add: false })
    head.fillStyle(0x2da41c)
    head.fillRect(0, 0, 64, 32)
    head.fillStyle(0x3de828)
    head.fillRect(4, 4, 12, 24)
    head.fillStyle(0x1a7a10)
    head.fillRect(48, 4, 12, 24)
    head.lineStyle(2, 0x000000, 0.4)
    head.strokeRect(0, 0, 64, 32)
    head.generateTexture('tile_pipe_head', 64, 32)
    head.destroy()
  }

  /** 雲テクスチャ */
  _makeCloudTexture() {
    const g = this.make.graphics({ add: false })
    // 雲の形（楕円を組み合わせ）
    g.fillStyle(0xffffff)
    g.fillEllipse(60, 40, 80, 50)
    g.fillEllipse(40, 50, 60, 40)
    g.fillEllipse(85, 50, 60, 40)
    // 輪郭
    g.lineStyle(2, 0xdddddd, 0.5)
    g.strokeEllipse(60, 40, 80, 50)
    g.generateTexture('cloud', 120, 70)
    g.destroy()
  }

  /** コインテクスチャ（ゴールド円形） */
  _makeCoinTexture() {
    const g = this.make.graphics({ add: false })
    // 外周（ゴールド）
    g.fillStyle(0xFFCC00)
    g.fillCircle(12, 12, 12)
    // 内側ハイライト
    g.fillStyle(0xFFE644)
    g.fillEllipse(10, 10, 14, 14)
    // 光点
    g.fillStyle(0xFFFAA0)
    g.fillCircle(8, 8, 3)
    // 外枠
    g.lineStyle(1.5, 0xCC9900, 0.9)
    g.strokeCircle(12, 12, 11)
    g.generateTexture('coin', 24, 24)
    g.destroy()
  }

  /** 背景の丘テクスチャ */
  _makeHillTexture() {
    const g = this.make.graphics({ add: false })
    g.fillStyle(0x5cb832)
    g.fillEllipse(100, 80, 200, 100)
    g.fillStyle(0x70d840)
    g.fillEllipse(100, 70, 180, 70)
    g.generateTexture('hill', 200, 90)
    g.destroy()
  }

  /** パーティクル用テクスチャ群 */
  _makeParticleTextures() {
    // 星パーティクル（踏みつけ・コイン用）
    const star = this.make.graphics({ add: false })
    star.fillStyle(0xffffff)
    star.fillTriangle(8, 0, 12, 6, 4, 6)   // 上
    star.fillTriangle(8, 16, 12, 10, 4, 10) // 下
    star.fillTriangle(0, 8, 6, 4, 6, 12)   // 左
    star.fillTriangle(16, 8, 10, 4, 10, 12) // 右
    star.generateTexture('particle_star', 16, 16)
    star.destroy()

    // 丸パーティクル（汎用）
    const circle = this.make.graphics({ add: false })
    circle.fillStyle(0xffffff)
    circle.fillCircle(5, 5, 5)
    circle.generateTexture('particle_circle', 10, 10)
    circle.destroy()

    // ほこりパーティクル（着地・走り用）
    const dust = this.make.graphics({ add: false })
    dust.fillStyle(0xe8d8b0, 0.9)
    dust.fillCircle(6, 6, 6)
    dust.generateTexture('particle_dust', 12, 12)
    dust.destroy()

    // スパーク（シェル・ブロック用）
    const spark = this.make.graphics({ add: false })
    spark.fillStyle(0xffffff)
    spark.fillRect(0, 3, 10, 4)
    spark.fillRect(3, 0, 4, 10)
    spark.generateTexture('particle_spark', 10, 10)
    spark.destroy()
  }

  /** 写真を円形にクリップしたテクスチャを生成 */
  /** ポートレートテクスチャを生成（上部を優先してクロップ） */
  _makePortraitTex(key, srcKey, w, h) {
    const rt = this.add.renderTexture(0, 0, w, h).setVisible(false)

    // 元画像のアスペクト比を維持して幅に合わせ、上からクロップ
    const srcTex = this.textures.get(srcKey).getSourceImage()
    const srcAspect = srcTex.width / srcTex.height
    const scaledH = Math.round(w / srcAspect)

    const tmp = this.add.image(w / 2, 0, srcKey)
      .setDisplaySize(w, scaledH)
      .setOrigin(0.5, 0)
      .setVisible(false)
    rt.draw(tmp, 0, 0)
    rt.saveTexture(key)
    tmp.destroy()
    rt.destroy()
  }

  /** 後方互換用（削除予定） */
  _makeCircleTex(key, srcKey, size) {
    this._makePortraitTex(key, srcKey, size, size)
  }
}
