export class Camera {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.x = 0;
        this.y = 0;
    }

    update(target, mapWidth) {
        // Center on target (player)
        this.x = target.x - this.width / 2;

        // Clamp to map bounds
        if (this.x < 0) this.x = 0;
        if (this.x > mapWidth - this.width) this.x = mapWidth - this.width;
    }
}
