export class Tooltip extends Phaser.GameObjects.Container {
    private text: Phaser.GameObjects.Text;
    private graphics: Phaser.GameObjects.Graphics;
    private tween?: Phaser.Tweens.Tween;

    constructor(scene: Phaser.Scene, config: any) {
        super(scene, config.x, config.y);

        const padding: number = config.padding || 5;

        this.text = scene.make.text(config);
        this.text.x += padding;
        this.text.y += padding;
        this.text.resolution = window.devicePixelRatio;

        const { width, height } = this.text;

        this.graphics = scene.make.graphics({ width: width + padding * 2, height: height + padding * 2 + 10 });

        this.graphics.fillStyle(0xAAAAAA, 0.85);
        this.graphics.fillRect(
            0, 0,
            width + padding * 2,
            height + padding * 2);

        this.graphics.fillTriangle(
            width / 2 - 5 + padding, height + padding * 2,
            width / 2 + 5 + padding, height + padding * 2,
            width / 2 + padding, height + padding * 2 + 7);

        this.add([this.graphics, this.text]);
        this.alpha = 0;

        [this.width, this.height] = [width + padding * 2, height + padding * 2];

        const target = config.target as Phaser.GameObjects.GameObject;

        if (!target) throw new Error("Tooltip must have a target.");

        target.on("pointerover", this.pointerover, this);
        target.on("pointerout", this.pointerout, this);
    }

    private pointerover(pointer: Phaser.Input.Pointer) {
        if (this.tween)
            this.tween.stop();

        this.tween = this.scene.tweens.add({
            targets: this,
            alpha: 1,
            duration: 100,
            delay: 500,
            easing: "Cubic.easeIn"
        });
    }

    private pointerout(pointer: Phaser.Input.Pointer) {
        if (this.tween)
            this.tween.stop();

        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            duration: 100,
            easing: "Cubic.easeIn"
        });
    }
}