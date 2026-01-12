export class Player {
    constructor(game, imageSrc = '/assets/player.png') {
        this.game = game;
        this.width = 32;
        this.height = 32;
        this.x = 100;
        this.y = 100;

        this.velX = 0;
        this.velY = 0;
        this.speed = 200; // pixels per second
        this.jumpForce = -600;
        this.gravity = 1500;

        this.isGrounded = false;

        this.image = new Image();
        this.image.src = imageSrc;

        // Animation state
        this.frameX = 0;
        this.frameY = 0;
        this.maxFrame = 3; // Assuming generated spritesheet has 4 frames
        this.fps = 10;
        this.frameTimer = 0;
        this.frameInterval = 1000 / this.fps;

        this.facingRight = true;
    }

    update(dt) {
        // Movement
        if (this.game.input.state.left) {
            this.velX = -this.speed;
            this.facingRight = false;
        } else if (this.game.input.state.right) {
            this.velX = this.speed;
            this.facingRight = true;
        } else {
            this.velX = 0;
        }

        // Jump
        if (this.game.input.state.jump && this.isGrounded) {
            this.velY = this.jumpForce;
            this.isGrounded = false;
            this.game.audio.play('jump');
        }

        // Apply Gravity
        this.velY += this.gravity * dt;

        // Apply Velocity
        this.x += this.velX * dt;
        this.y += this.velY * dt;

        // Simple Floor Collision (for now, y > 300 is floor)
        if (this.y > 300) {
            this.y = 300;
            this.velY = 0;
            this.isGrounded = true;
        }

        // Animation Logic
        if (Math.abs(this.velX) > 0) {
            // Running
            this.frameTimer += dt * 1000;
            if (this.frameTimer > this.frameInterval) {
                this.frameTimer = 0;
                this.frameX++;
                if (this.frameX > this.maxFrame) this.frameX = 1; // Loop frames 1-3
            }
        } else {
            // Idle
            this.frameX = 0;
        }

        // Jump frame
        if (!this.isGrounded) {
            this.frameX = 3; // Assume last frame is jump
        }
    }

    draw(ctx) {
        // Flip sprite if facing left
        ctx.save();
        if (!this.facingRight) {
            ctx.translate(this.x + this.width, this.y);
            ctx.scale(-1, 1);
            ctx.drawImage(this.image,
                this.frameX * 32, 0, 32, 32, // Source (assuming 32x32 sprites)
                0, 0, this.width, this.height // Destination relative to translated
            );
        } else {
            ctx.drawImage(this.image,
                this.frameX * 32, 0, 32, 32,
                this.x, this.y, this.width, this.height
            );
        }
        ctx.restore();

        // Debug Box
        // ctx.strokeStyle = 'red';
        // ctx.strokeRect(this.x, this.y, this.width, this.height);
    }
}
