import './style.css'
import { Game } from './engine/Game.js'
import { registerSW } from 'virtual:pwa-register'

// Register Service Worker for PWA
const updateSW = registerSW({
  onNeedRefresh() {
    // Show a prompt to user to refresh
    if (confirm('New content available. Reload?')) {
      updateSW(true)
    }
  }
})

// Initialize Game
const game = new Game();
game.start();
