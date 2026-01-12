export class Player {
    constructor(game, imageSrc = 'assets/player.png') {
        this.game = game;
        this.width = 32;
        this.height = 32;
        this.x = 100;
        this.y = 100;

        this.velX = 0;
        this.velY = 0;
        this.maxSpeed = 250;
        this.acceleration = 800;
        this.friction = 600;
        this.jumpForce = -600;
        this.gravity = 1500;

        this.isGrounded = false;

        this.image = new Image();
        this.image.onload = () => {
            this.loaded = true;
        };
        this.image.onerror = () => {
            console.error(`Failed to load image: ${this.image.src}`);
            this.loaded = false;
        };
        this.image.src = imageSrc;
        this.loaded = false;

        // Animation state
        this.frameX = 0;
        this.frameY = 0;
        this.maxFrame = 3;
        this.fps = 10;
        this.frameTimer = 0;
        this.frameInterval = 1000 / this.fps;

        this.facingRight = true;

        this.powerState = 'small'; // small, big, fire
        this.invulnerable = false;
        this.invulnerableTimer = 0;
    }

    grow() {
        if (this.powerState === 'small') {
            this.powerState = 'big';
            this.y -= 16; // Grow up
            this.height = 48; // Taller
            // Ideally change sprite or scale?
            // For now, let's just scale Y drawing or keep bounding box larger
        }
    }

    powerUpFire() {
        this.powerState = 'fire';
        this.grow(); // Ensure big size
    }

    takeDamage() {
        if (this.invulnerable) return;

        if (this.powerState === 'fire' || this.powerState === 'big') {
            this.powerState = 'small';
            this.height = 32;
            this.invulnerable = true;
            this.invulnerableTimer = 2; // 2 seconds
            this.game.audio.play('coin'); // shrinking sound?
        } else {
            // Die
            this.game.state = 3;
            this.velY = -400;
            this.isGrounded = false;
            this.isDead = true;
            this.game.audio.play('death');
        }
    }

    update(dt) {
        if (this.invulnerable) {
            this.invulnerableTimer -= dt;
            if (this.invulnerableTimer <= 0) {
                this.invulnerable = false;
            }
        }

        if (this.isDead) return; // Disable movement

        // Movement with Inertia
        if (this.game.input.state.left) {
            if (this.velX > 0) this.velX -= this.friction * 2 * dt; // Quick turn
            this.velX -= this.acceleration * dt;
            this.facingRight = false;
        } else if (this.game.input.state.right) {
            if (this.velX < 0) this.velX += this.friction * 2 * dt; // Quick turn
            this.velX += this.acceleration * dt;
            this.facingRight = true;
        } else {
            // Friction
            if (Math.abs(this.velX) > 10) {
                this.velX -= Math.sign(this.velX) * this.friction * dt;
            } else {
                this.velX = 0;
            }
        }

        // Clamp Speed
        if (Math.abs(this.velX) > this.maxSpeed) {
            this.velX = Math.sign(this.velX) * this.maxSpeed;
        }

        // Jump
        if (this.game.input.state.jump) {
            if (this.isGrounded) {
                this.velY = this.jumpForce;
                this.isGrounded = false;
                this.game.audio.play('jump');
            }
        } else {
            // Variable Jump Height: cut velocity if released early
            if (this.velY < -100 && !this.isGrounded) {
                this.velY *= 0.5; // Dampen upward velocity
            }
        }

        // Apply Gravity
        this.velY += this.gravity * dt;

        // Apply Velocity
        this.x += this.velX * dt;
        this.y += this.velY * dt;

        // Simple Floor Collision
        if (this.y > this.game.groundY - this.height) {
            this.y = this.game.groundY - this.height;
            this.velY = 0;
            this.isGrounded = true;
        }

        // Animation Logic
        if (Math.abs(this.velX) > 10) {
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
        // Prevent drawing broken images
        if (!this.image.complete || this.image.naturalWidth === 0) return;

        // Flip sprite if facing left
        ctx.save();
        if (!this.loaded) return;

        if (!this.facingRight) {
            ctx.translate(this.x + this.width, this.y);
            ctx.scale(-1, 1);
            if (this.isDead) ctx.rotate(Math.PI); // Upside down dead
            ctx.drawImage(this.image,
                this.frameX * 32, 0, 32, 32, // Source (assuming 32x32 sprites)
                0, 0, this.width, this.height // Destination relative to translated
            );
        } else {
            if (this.isDead) { // Manual transform for right facing dead
                ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
                ctx.rotate(Math.PI);
                ctx.drawImage(this.image,
                    this.frameX * 32, 0, 32, 32,
                    -this.width / 2, -this.height / 2, this.width, this.height
                );
            } else {
                ctx.drawImage(this.image,
                    this.frameX * 32, 0, 32, 32,
                    this.x, this.y, this.width, this.height
                );
            }
        }
        ctx.restore();
    }
}
