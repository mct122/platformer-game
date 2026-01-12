import { Input } from './Input.js';
import { Audio } from './Audio.js';
import { Player } from '../entities/Player.js';
import { Enemy } from '../entities/Enemy.js';
import { Koopa } from '../entities/Koopa.js';
import { Piranha } from '../entities/Piranha.js';
import { Block } from '../entities/Block.js';
import { Background } from './Background.js';
import { Camera } from './Camera.js';

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
        this.topBarEl = document.querySelector('.top-bar');

        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.input = new Input();
        this.audio = new Audio();
        this.camera = new Camera(this.canvas.width, this.canvas.height);
        this.background = new Background(this);
        this.state = STATE.TITLE;

        this.groundY = this.canvas.height - 64;

        this.characters = [
            { name: 'Mario', src: 'assets/player.png' },
            { name: 'Luigi', src: 'assets/player_green.png' },
            { name: 'Peach', src: 'assets/player_pink.png' }
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
        this.canvas.addEventListener('click', (e) => {
            if (this.audio.ctx.state === 'suspended') this.audio.ctx.resume();
            this.handleClick(e);
        });
        // Also touch for mobile
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (this.audio.ctx.state === 'suspended') this.audio.ctx.resume();
            const touch = e.changedTouches[0];
            this.handleClick({ clientX: touch.clientX, clientY: touch.clientY });
        }, { passive: false });

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
            // Scale coords if canvas is scaled by CSS
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;

            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;

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
        this.groundY = this.canvas.height - 64;
        this.selectedCharIndex = charIndex;
        this.player = new Player(this, this.characters[charIndex].src);

        this.enemies = [];
        this.items = [];
        this.blocks = [];

        // Level 1-1 Layout Construction
        this.buildLevel1_1();

        this.state = STATE.PLAYING;
        this.audio.play('coin');
        setTimeout(() => this.audio.startBGM(), 500);

        this.controlsEl.style.display = 'flex'; // Show controls
        this.topBarEl.style.display = 'flex';
    }

    buildLevel1_1() {
        // 1-1 Style: 
        // Start -> Goomba -> Block -> Pipes -> Pit -> Goal

        // Blocks
        this.blocks.push(new Block(this, 500, this.groundY - 128, 'mushroom'));
        this.blocks.push(new Block(this, 700, this.groundY - 128, 'coin'));
        this.blocks.push(new Block(this, 732, this.groundY - 128, 'coin'));
        this.blocks.push(new Block(this, 764, this.groundY - 128, 'coin'));
        this.blocks.push(new Block(this, 800, this.groundY - 200, 'flower')); // High block

        // Enemies
        this.enemies.push(new Enemy(this, 600, this.groundY - 32));
        this.enemies.push(new Enemy(this, 1000, this.groundY - 32));
        this.enemies.push(new Koopa(this, 1200, this.groundY));
        this.enemies.push(new Enemy(this, 1300, this.groundY - 32));
        this.enemies.push(new Piranha(this, 1800, this.groundY - 48)); // Pipe plant (Pipe visual missing but plant is there)
        this.enemies.push(new Koopa(this, 2200, this.groundY));

        // Goal (Simulated by simple x check for now)
        this.goalX = 3000;
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.ctx.imageSmoothingEnabled = false;
        this.groundY = this.canvas.height - 64;
        if (this.camera) {
            this.camera.width = this.canvas.width;
            this.camera.height = this.canvas.height;
        }
    }

    start() {
        this.isRunning = true;
        this.lastTime = performance.now();
        this.controlsEl.style.display = 'none';
        requestAnimationFrame(this.loop.bind(this));
    }

    loop(timestamp) {
        if (!this.isRunning) return;

        try {
            const deltaTime = timestamp - this.lastTime;
            this.lastTime = timestamp;
            this.accumulatedTime += deltaTime;

            while (this.accumulatedTime >= this.timeStep) {
                this.update(this.timeStep / 1000);
                this.accumulatedTime -= this.timeStep;
            }

            this.draw();
        } catch (e) {
            console.error(e);
            this.ctx.resetTransform(); // Reset camera
            this.ctx.fillStyle = 'red';
            this.ctx.font = '20px sans-serif';
            this.ctx.fillText('Error: ' + e.message, 10, 50);
            this.ctx.fillText(e.stack ? e.stack.slice(0, 100) : '', 10, 80);
            this.isRunning = false; // Stop loop
            return;
        }

        requestAnimationFrame(this.loop.bind(this));
    }

    update(dt) {
        this.background.update(dt);
        if (this.state === STATE.PLAYING) {
            const p = this.player;
            p.update(dt);

            this.blocks.forEach(b => b.update(dt));
            this.items.forEach(i => i.update(dt));
            this.enemies.forEach(e => e.update(dt));

            // Cleanup
            this.enemies = this.enemies.filter(e => !e.markedForDeletion);
            this.items = this.items.filter(i => !i.markedForDeletion);

            this.camera.update(p, 4000); // 4000 map width
            this.background.x = -(this.camera.x * 0.2);

            // Goal Check
            if (p.x > this.goalX) {
                // Win!
                this.audio.play('coin'); // Win sound placeholder
                this.state = STATE.TITLE; // Loop back
                this.audio.stopBGM();
                this.controlsEl.style.display = 'none'; // Show controls
                this.topBarEl.style.display = 'none';
            }

            // Simple Game Over reset
            if (p.isDead || p.y > this.canvas.height) {
                this.state = STATE.TITLE;
                this.audio.stopBGM();
                this.controlsEl.style.display = 'none'; // Show controls
                this.topBarEl.style.display = 'none';
            }
        }
    }

    draw() {
        this.ctx.fillStyle = '#222';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.state === STATE.PLAYING || this.state === STATE.TITLE || this.state === STATE.CHAR_SELECT) {
            this.background.draw(this.ctx);
        }

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
        this.ctx.shadowColor = 'black';
        this.ctx.shadowBlur = 4;
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
        this.ctx.shadowColor = 'black';
        this.ctx.shadowBlur = 4;
        this.ctx.font = '30px monospace';
        this.ctx.fillText('キャラクターを選択', this.canvas.width / 2, 100);

        const gap = 100;
        const startX = this.canvas.width / 2 - gap;
        const centerY = this.canvas.height / 2;

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
        this.ctx.save();
        this.ctx.translate(-this.camera.x, 0);

        // Draw Ground
        this.ctx.fillStyle = '#834c32';
        this.ctx.fillRect(0, this.groundY, 4000, this.canvas.height - this.groundY);

        // Draw Flagpole (Goal) - Simple stick
        this.ctx.fillStyle = '#eee';
        this.ctx.fillRect(this.goalX, this.groundY - 300, 10, 300);
        this.ctx.fillStyle = 'red';
        this.ctx.fillRect(this.goalX + 10, this.groundY - 280, 50, 30); // Flag

        this.blocks.forEach(b => b.draw(this.ctx));
        this.items.forEach(i => i.draw(this.ctx));
        this.enemies.forEach(e => e.draw(this.ctx));
        this.player.draw(this.ctx);

        this.ctx.restore();
    }
}
