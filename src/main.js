import Phaser from 'phaser'
import { BootScene } from './scenes/BootScene.js'
import { TitleScene } from './scenes/TitleScene.js'
import { CharSelectScene } from './scenes/CharSelectScene.js'
import { GameScene } from './scenes/GameScene.js'
import { UIScene } from './scenes/UIScene.js'
import { AudioManager } from './utils/AudioManager.js'

// グローバルオーディオマネージャー (シーン間で共有)
export const audio = new AudioManager()

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#1a1a2e',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 960,
    height: 540
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 2600 },
      debug: false
    }
  },
  scene: [BootScene, TitleScene, CharSelectScene, GameScene, UIScene]
}

new Phaser.Game(config)
