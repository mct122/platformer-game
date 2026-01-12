export class Item {
    constructor(game, x, y, type) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.width = 32;
        this.height = 32;
        this.type = type; // 'mushroom', 'flower'
        this.velX = 50;
        this.velY = -200; // Pop up
        this.isSpawning = true;
        this.spawnY = y - 32;

        this.image = new Image();
        this.image.onload = () => { this.loaded = true; };
        this.image.onerror = () => { console.error(`Failed to load image: ${this.image.src}`); this.loaded = false; };
        this.image.src = type === 'mushroom' ? 'assets/mushroom.png' : 'assets/flower.png';
        this.loaded = false;

        this.markedForDeletion = false;
    }

    update(dt) {
        if (this.isSpawning) {
            this.y -= 50 * dt;
            if (this.y < this.spawnY) {
                this.y = this.spawnY;
                this.isSpawning = false;
                this.velY = 0;
            }
            return;
        }

        // Flower is stationary? No, usually static but let's make it bounce or just sit?
        // Mushroom moves
        if (this.type === 'mushroom') {
            this.velY += 1500 * dt;
            this.x += this.velX * dt;

            // Ground
            if (this.y > this.game.groundY - this.height) {
                this.y = this.game.groundY - this.height;
                this.velY = 0;
            }

            // Wall bounce (simple bounds)
            if (this.x < 0 || this.x > 20000) this.velX *= -1;
        } else {
            // Flower logic (static)
            this.velY += 1500 * dt;
            if (this.y > this.game.groundY - this.height) {
                this.y = this.game.groundY - this.height;
                this.velY = 0;
            }
        }

        // Collect
        if (this.checkCollision(this.game.player)) {
            if (this.type === 'mushroom') this.game.player.grow();
            if (this.type === 'flower') this.game.player.powerUpFire();
            this.markedForDeletion = true;
            this.game.audio.play('coin'); // Should be powerup sound
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

    draw(ctx) {
        if (!this.loaded) return;
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }
}
