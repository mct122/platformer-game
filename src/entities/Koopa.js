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
        this.image.onload = () => { this.loaded = true; };
        this.image.onerror = () => { console.error(`Failed to load image: ${this.image.src}`); this.loaded = false; };
        this.image.src = 'assets/koopa.png';
        this.loaded = false;

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
            // Stomp Logic: Player falling and above enemy
            if (player.velY > 0 && player.y + player.height < this.y + this.height * 0.5) {
                player.velY = -300; // Bounce
                player.y = this.y - player.height; // Snap top to prevent clipping

                if (this.state === 'walking') {
                    this.state = 'shell_still';
                    this.height = 32; // Duck
                    this.y = this.game.groundY - 32; // Force to ground for alignment? Or just keep relative
                    this.velX = 0;
                } else if (this.state === 'shell_still') {
                    this.state = 'shell_moving';
                    // Kick away from player
                    this.velX = (player.x < this.x) ? 400 : -400;
                    // Prevent immediate re-collision?
                    this.x += (this.velX > 0) ? 10 : -10;
                } else if (this.state === 'shell_moving') {
                    this.state = 'shell_still';
                    this.velX = 0;
                }
                this.game.audio.play('coin');
            } else {
                // Not a stomp
                if (this.state === 'shell_still') {
                    // Kick it
                    this.state = 'shell_moving';
                    this.velX = (player.x < this.x) ? 400 : -400;
                    this.game.audio.play('coin');
                } else {
                    // Hurt player ONLY if side/bottom
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
        if (!this.loaded) return;
        // Draw standard or shell sprite
        if (this.state !== 'walking') {
            // Visual cue?
        }
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }
}
