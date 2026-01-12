export class Koopa {
    constructor(game, x, y) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.width = 32;
        this.height = 48; // Taller than goomba
        this.speed = 30; // Slower
        this.velX = -this.speed;
        this.velY = 0;

        this.image = new Image();
        this.image.src = '/assets/koopa.png';

        this.state = 'walking'; // walking, shell_still, shell_moving
        this.markedForDeletion = false;
    }

    update(dt) {
        this.velY += 1500 * dt; // Gravity
        this.y += this.velY * dt;

        // Ground collision
        if (this.y > this.game.groundY - this.height) {
            this.y = this.game.groundY - this.height;
            this.velY = 0;
        }

        if (this.state === 'walking') {
            this.x += this.velX * dt;
            if (this.x < 0 || this.x > 20000) this.velX *= -1; // Simple world bounds
        } else if (this.state === 'shell_moving') {
            this.x += this.velX * dt;
        }

        // Check Collision with Player
        if (this.checkCollision(this.game.player)) {
            const player = this.game.player;
            if (player.velY > 0 && player.y < this.y + 10) {
                // Stomp
                player.velY = -300;
                if (this.state === 'walking') {
                    this.state = 'shell_still';
                    this.height = 32; // Duck into shell
                    this.y += 16;
                    this.velX = 0;
                } else if (this.state === 'shell_still') {
                    this.state = 'shell_moving';
                    // Kick depending on player pos
                    this.velX = (player.x < this.x) ? 400 : -400;
                } else if (this.state === 'shell_moving') {
                    this.state = 'shell_still';
                    this.velX = 0;
                }
                this.game.audio.play('coin');
            } else {
                // Hit player
                if (this.state === 'shell_still') {
                    // Kick
                    this.state = 'shell_moving';
                    this.velX = (player.x < this.x) ? 400 : -400;
                    player.x += (player.x < this.x) ? -10 : 10;
                } else {
                    // Hurt player
                    player.takeDamage();
                }
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

    draw(ctx) {
        // Draw standard or shell sprite
        if (this.state !== 'walking') {
            // Visual cue?
        }
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }
}
