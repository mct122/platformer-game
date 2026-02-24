/**
 * Background Class
 * 
 * 背景を管理するクラスです。
 * プレイヤーの動きに合わせてパララックス（視差）効果を提供します。
 */
export class Background {
    constructor(game) {
        this.game = game;
        this.image = new Image();
        this.image.onload = () => { this.loaded = true; };
        this.image.onerror = () => { console.error(`Failed to load background image: ${this.image.src}`); this.loaded = false; };
        this.image.src = 'assets/sky.png';
        this.loaded = false;
        this.x = 0;
        this.speed = 20; // プレイヤーより遅く動く
    }

    update(dt) {
        // プレイヤーの動きに基づいたパララックス効果
        if (this.game.player && this.game.player.velX !== 0) {
            // プレイヤーと逆方向に、しかし遅い速度で背景を移動させる
            this.x -= (this.game.player.velX * 0.2) * dt;
        }

        // 背景のループ処理
        if (this.image.width > 0) {
            if (this.x <= -this.image.width) this.x += this.image.width;
            if (this.x >= this.image.width) this.x -= this.image.width;
        }
    }

    draw(ctx) {
        if (!this.loaded || !this.image.width) return;

        // 画面を埋めるために画像を複数回描画する
        // 簡易的なタイリング処理

        let startX = this.x % this.image.width;

        // startXが正の場合でも簡略化のため調整
        if (startX > 0) startX -= this.image.width;

        let currentX = startX;
        while (currentX < ctx.canvas.width) {
            ctx.drawImage(this.image, currentX, 0, this.image.width, ctx.canvas.height); // 高さはキャンバスに合わせる
            currentX += this.image.width;
        }
    }
}
