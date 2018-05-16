export class Tooltip extends Phaser.GameObjects.Container {
    private text: Phaser.GameObjects.Text;
    private graphics: Phaser.GameObjects.Graphics;
    private tween?: Phaser.Tweens.Tween;

    constructor(scene: Phaser.Scene, config: any) {
        super(scene, config.x, config.y);

        const padding: number = config.padding || 5;

        if (config.style.fontSize)
            config.style.fontSize *= window.devicePixelRatio;

        config.scale = ("scale" in config ? config.scale : 1) / window.devicePixelRatio;

        this.text = scene.make.text(config);
        this.text.resolution = window.devicePixelRatio;

        const { width, height } = this.text;

        this.graphics = scene.make.graphics({ width: width + padding * 2, height: height + padding * 2 + 10 });

        this.graphics.fillStyle(0xAAAAAA, 0.85);
        this.graphics.fillRect(
            -padding - width / 2, -padding - height / 2,
            width + padding * 2,
            height + padding * 2);

        this.graphics.fillTriangle(
            -5, height / 2 + padding,
            5, height / 2 + padding,
            0, height / 2 + padding + 7);

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