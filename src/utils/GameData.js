export const CHARACTERS = [
  {
    name: 'Donko',
    folder: 'chara/donko',
    normal: 'chara/donko/normal.png',
    super: 'chara/donko/super.png',
    color: 0xe74c3c,
    // バランス型（標準）
    stats: { speed: 260, accel: 1400, jump: -690, fallMulti: 1.8 },
    tag: 'BALANCED'
  },
  {
    name: 'Poon',
    folder: 'chara/poon',
    normal: 'chara/poon/normal.png',
    super: 'chara/poon/super.png',
    color: 0x3498db,
    // スピード型（速いが低いジャンプ）
    stats: { speed: 340, accel: 1900, jump: -620, fallMulti: 2.2 },
    tag: 'SPEED'
  },
  {
    name: 'Emanuel',
    folder: 'chara/ema',
    normal: 'chara/ema/normal.png',
    super: 'chara/ema/super.png',
    color: 0x2ecc71,
    // ジャンプ型（高いジャンプだが遅め）
    stats: { speed: 210, accel: 1100, jump: -820, fallMulti: 1.4 },
    tag: 'JUMPER'
  }
]

export const TILE_SIZE = 32
export const PLAYER_SIZE = 44
export const GRAVITY = 2600
export const MAP_WIDTH = 6400
export const MAP_HEIGHT = 800
