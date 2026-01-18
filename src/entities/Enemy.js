export class Enemy {
    constructor(game, x, y) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 40;
        this.speed = 50;
        this.velX = this.speed;

        this.image = new Image();
        this.image.onload = () => { this.loaded = true; };
        this.image.onerror = () => { console.error(`Failed to load image: ${this.image.src}`); this.loaded = false; };
        this.image.src = 'assets/enemy.png';
        this.loaded = false;

        this.markedForDeletion = false;
        this.isDead = false;
        this.deathTimer = 0;
    }

    update(dt) {
        if (this.isDead) {
            this.deathTimer += dt;
            if (this.deathTimer > 0.5) {
                this.markedForDeletion = true;
            }
            return;
        }

        this.x += this.velX * dt;

        // Simple patrol
        if (this.x > this.game.canvas.width - 50) this.velX = -this.speed;
        if (this.x < 0) this.velX = this.speed;

        // Checks collision with player
        if (this.checkCollision(this.game.player)) {
            if (this.game.player.velY > 0 && this.game.player.y < this.y) {
                // Stomp Success
                this.squash();
                this.game.player.velY = -300; // Bounce
                this.game.audio.play('coin');
            } else {
                this.game.player.x = 100;
                this.game.player.y = 100;
            }
        }
    }

    checkCollision(rect) {
        return (
            this.x < rect.x + rect.width &&
            this.x + this.width > rect.x &&
            this.y < rect.y + rect.height &&
            this.y + this.height > rect.y
        );
    }

    squash() {
        this.isDead = true;
        this.height = 16; // Squash visual
        this.y += 16; // Adjust position to stay on floor
    }

    draw(ctx) {
        if (!this.loaded) return;
        if (this.isDead) {
            ctx.globalAlpha = 1 - (this.deathTimer * 2); // Fade out
        }

        ctx.save();
        ctx.translate(this.x, this.y);

        // Circular Clip
        ctx.beginPath();
        ctx.arc(this.width / 2, this.height / 2, this.width / 2, 0, Math.PI * 2);
        ctx.clip();

        ctx.drawImage(this.image, 0, 0, this.width, this.height);
        ctx.restore();

        ctx.globalAlpha = 1.0;
    }
}
