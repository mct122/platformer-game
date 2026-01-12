export class Enemy {
    constructor(game, x, y) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.width = 32;
        this.height = 32;
        this.speed = 50;
        this.velX = this.speed;

        this.image = new Image();
        this.image.src = '/assets/enemy.png';

        this.markedForDeletion = false;
    }

    update(dt) {
        this.x += this.velX * dt;

        // Simple patrol
        if (this.x > this.game.canvas.width - 50) this.velX = -this.speed;
        if (this.x < 0) this.velX = this.speed;

        // Checks collision with player
        if (this.checkCollision(this.game.player)) {
            // Simple collision logic: if player is above, enemy dies. Else player dies.
            if (this.game.player.velY > 0 && this.game.player.y < this.y) {
                this.markedForDeletion = true;
                this.game.player.velY = -300; // Bounce
                this.game.audio.play('coin'); // Sound effect
            } else {
                // Player hit (reset pos for now)
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

    draw(ctx) {
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }
}
