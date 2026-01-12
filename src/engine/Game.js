import { Input } from './Input.js';
import { Audio } from './Audio.js';
import { Player } from '../entities/Player.js';
import { Enemy } from '../entities/Enemy.js';

const STATE = {
    TITLE: 0,
    CHAR_SELECT: 1,
    PLAYING: 2,
    GAME_OVER: 3
};

export class Game {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        document.querySelector('#app').appendChild(this.canvas);

        this.uiLayer = document.getElementById('ui-layer');
        this.controlsEl = document.querySelector('.controls');
        this.topBarEl = document.querySelector('.top-bar'); // Score and Sound

        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.input = new Input();
        this.audio = new Audio();
        this.state = STATE.TITLE;

        this.characters = [
            { name: 'Mario', src: '/assets/player.png' },
            { name: 'Luigi', src: '/assets/player_green.png' },
            { name: 'Peach', src: '/assets/player_pink.png' }
        ];
        this.selectedCharIndex = 0;

        // Attach touch controls
        const btnLeft = document.getElementById('btn-left');
        const btnRight = document.getElementById('btn-right');
        const btnJump = document.getElementById('btn-jump');
        this.input.attachTouchControls(btnLeft, btnRight, btnJump);

        // Audio Toggle
        const soundToggle = document.getElementById('sound-toggle');
        soundToggle.addEventListener('click', () => {
            const isMuted = this.audio.toggleMute();
            soundToggle.textContent = isMuted ? '🔇 OFF' : '🔊 ON';
        });

        // Title/Select Click Handling
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        // Also touch for mobile
        this.canvas.addEventListener('touchstart', (e) => {
            // Simple hack to convert touch to click logic
            const touch = e.changedTouches[0];
            this.handleClick({ clientX: touch.clientX, clientY: touch.clientY });
        });

        this.score = 0;
        this.scoreEl = document.getElementById('score');

        this.lastTime = 0;
        this.accumulatedTime = 0;
        this.timeStep = 1000 / 60;

        this.isRunning = false;
    }

    handleClick(e) {
        if (this.state === STATE.TITLE) {
            this.state = STATE.CHAR_SELECT;
            // Play sound
            this.audio.play('jump');
        } else if (this.state === STATE.CHAR_SELECT) {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Simple hit detection for 3 characters drawn in center
            const gap = 100;
            const startX = this.canvas.width / 2 - gap;
            const centerY = this.canvas.height / 2;

            if (Math.abs(y - centerY) < 50) {
                if (Math.abs(x - (startX)) < 40) this.startGame(0); // Left
                if (Math.abs(x - (this.canvas.width / 2)) < 40) this.startGame(1); // Center
                if (Math.abs(x - (startX + gap * 2)) < 40) this.startGame(2); // Right
            }
        }
    }

    startGame(charIndex) {
        this.selectedCharIndex = charIndex;
        this.player = new Player(this, this.characters[charIndex].src);
        this.enemies = [];
        this.enemies.push(new Enemy(this, 500, 300));
        this.enemies.push(new Enemy(this, 1200, 300));
        this.enemies.push(new Enemy(this, 1600, 300));

        this.state = STATE.PLAYING;
        this.audio.play('coin');

        this.controlsEl.style.display = 'flex'; // Show controls
        this.topBarEl.style.display = 'flex';
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.ctx.imageSmoothingEnabled = false;
    }

    start() {
        this.isRunning = true;
        this.lastTime = performance.now();

        // Hide controls initially
        this.controlsEl.style.display = 'none';

        requestAnimationFrame(this.loop.bind(this));
    }

    loop(timestamp) {
        if (!this.isRunning) return;

        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;
        this.accumulatedTime += deltaTime;

        while (this.accumulatedTime >= this.timeStep) {
            this.update(this.timeStep / 1000);
            this.accumulatedTime -= this.timeStep;
        }

        this.draw();
        requestAnimationFrame(this.loop.bind(this));
    }

    update(dt) {
        if (this.state === STATE.PLAYING) {
            this.player.update(dt);
            this.enemies.forEach(enemy => enemy.update(dt));
            this.enemies = this.enemies.filter(enemy => !enemy.markedForDeletion);

            // Simple Game Over reset
            if (this.player.y > this.canvas.height) {
                // Fall off world
                this.state = STATE.TITLE;
                this.controlsEl.style.display = 'none';
                this.topBarEl.style.display = 'none'; // Hide top bar too
            }
        }
    }

    draw() {
        this.ctx.fillStyle = '#222';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.state === STATE.TITLE) {
            this.drawTitle();
        } else if (this.state === STATE.CHAR_SELECT) {
            this.drawCharSelect();
        } else if (this.state === STATE.PLAYING) {
            this.drawGame();
        }
    }

    drawTitle() {
        this.ctx.save();
        this.ctx.fillStyle = 'white';
        this.ctx.textAlign = 'center';
        this.ctx.font = '40px monospace';
        this.ctx.fillText('SUPER RETRO PLATFORMER', this.canvas.width / 2, this.canvas.height / 2 - 50);

        this.ctx.font = '20px monospace';
        if (Math.floor(Date.now() / 500) % 2 === 0) {
            this.ctx.fillText('画面をタップしてスタート', this.canvas.width / 2, this.canvas.height / 2 + 50);
        }
        this.ctx.restore();
    }

    drawCharSelect() {
        this.ctx.save();
        this.ctx.fillStyle = 'white';
        this.ctx.textAlign = 'center';
        this.ctx.font = '30px monospace';
        this.ctx.fillText('キャラクターを選択', this.canvas.width / 2, 100);

        const gap = 100;
        const startX = this.canvas.width / 2 - gap;
        const centerY = this.canvas.height / 2;

        // Draw 3 character placeholders or sprites if loaded
        // We'll create temp images for them if they aren't preloaded, but Player needs an instance/image to draw.
        // For now, simpler: just draw text or colored boxes if images aren't handy in this context, 
        // but we have paths.

        const drawChar = (idx, x, color, name) => {
            this.ctx.fillStyle = color;
            this.ctx.beginPath();
            this.ctx.arc(x, centerY, 40, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.fillStyle = 'white';
            this.ctx.font = '16px monospace';
            this.ctx.fillText(name, x, centerY + 60);
        };

        drawChar(0, startX, 'red', 'マリオ');
        drawChar(1, this.canvas.width / 2, 'green', 'ルイージ');
        drawChar(2, startX + gap * 2, 'pink', 'ピーチ');

        this.ctx.restore();
    }

    drawGame() {
        this.ctx.fillStyle = '#5c94fc';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw Ground
        this.ctx.fillStyle = '#834c32';
        this.ctx.fillRect(0, 300 + 32, this.canvas.width, this.canvas.height - 300);

        // Draw Entities
        this.player.draw(this.ctx);
        this.enemies.forEach(enemy => enemy.draw(this.ctx));
    }
}
