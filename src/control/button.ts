import { Tooltip } from "@control/tooltip";

export class Button extends Phaser.GameObjects.Container {

    public tooltip: Phaser.GameObjects.Container | undefined;
    public text: Phaser.GameObjects.Text | undefined;
    public sprite: Phaser.GameObjects.Sprite;

    constructor(scene: Phaser.Scene, config: any) {
        super(scene, config.x, config.y);

        this.sprite = scene.make.sprite(config.sprite);
        if (config.sprite.tint) this.sprite.tint = config.sprite.tint;
        this.add(this.sprite);

        if ("text" in config) {
            this.text = scene.make.text({ origin: 0.5, ...config.text });
            this.add(this.text);
        }

        if ("tooltip" in config) {
            this.tooltip = new Tooltip(scene, { target: this, ...config.tooltip });
            this.tooltip.x = -this.tooltip.width / 2;
            this.tooltip.y = -this.tooltip.height - 35;

            this.add(this.tooltip);
        }

        this.sprite.setInteractive();
        this.sprite.on("pointerover", this.pointerover, this);
        this.sprite.on("pointerout", this.pointerout, this);
        this.sprite.on("pointerdown", this.pointerdown, this);
        this.sprite.on("pointerup", this.pointerup, this);
    }

    private pointerover(pointer: Phaser.Input.Pointer) {
        this.scene.tweens.add({
            targets: this,
            scaleX: 0.9,
            scaleY: 0.9,
            duration: 100,
            easing: "Cubic.easeIn"
        });

        this.emit("pointerover", ...arguments);
    }

    private pointerout(pointer: Phaser.Input.Pointer) {
        this.scene.tweens.add({
            targets: this,
            scaleX: 1.0,
            scaleY: 1.0,
            duration: 100,
            easing: "Cubic.easeIn"
        });

        this.emit("pointerout", ...arguments);
    }

    private pointerdown(pointer: Phaser.Input.Pointer) {
        this.scene.tweens.add({
            targets: this,
            scaleX: 0.8,
            scaleY: 0.8,
            duration: 100,
            easing: "Cubic.easeIn"
        });

        this.emit("pointerdown", ...arguments);
    }

    private pointerup(pointer: Phaser.Input.Pointer) {
        this.scene.tweens.add({
            targets: this,
            scaleX: 0.9,
            scaleY: 0.9,
            duration: 100,
            easing: "Cubic.easeIn"
        });

        this.emit("pointerup", ...arguments);
    }
}