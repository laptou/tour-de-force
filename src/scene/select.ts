import * as Phaser from "phaser";

import { inset } from "../util";

const { sin, cos, random, PI, max } = Math;

export class LevelSelectScene extends Phaser.Scene {

    private buttonContainer: Phaser.GameObjects.Container | undefined;
    private titleText: Phaser.GameObjects.Text | undefined;
    private grid: Phaser.GameObjects.TileSprite | undefined;
    private speed: number = 0.05;
    private size = { rows: 3, cols: 5 };

    constructor() {
        super({ key: "level-select" });
    }

    public preload() {
        this.events.on("transitioncomplete", this.transitioncomplete, this);

        this.load.spritesheet("controls", require("@res/img/control-sprites.png"), { frameWidth: 128, frameHeight: 128 });
    }

    public create() {
        const { width, height } = this.cameras.main;
        const self = this as any;
        this.grid = this.add.tileSprite(width / 2, height / 2, width, height, "tile");

        this.titleText =
            this.add.text(20, -50, "Choose a level")
                .setFontFamily("Montserrat Black")
                .setFontSize(32)
                .setFill("#EE0000")
                .setStroke("#FFFFFF", 10)
                .setShadow(0, 0, "#AAAAAA", 6, true, false);

        const mask = this.make.graphics();
        mask.fillStyle(0xFFFFFF);
        mask.fillCircle(50, 50, 300);
        this.children.remove(mask);

        const buttons: Phaser.GameObjects.GameObject[] = [];

        for (let row = 0; row < this.size.rows; row++) {
            for (let col = 0; col < this.size.cols; col++) {
                const level = row * this.size.cols + col;

                const button = this.make.container({});
                const sprite = this.make.sprite({ key: "controls", frame: 0 });

                const text = this.make.text({
                    style: {
                        fontFamily: "Montserrat Black",
                        fontSize: 32,
                        fill: "#FFFFFF"
                    },
                    text: (level + 1).toString(10)
                });
                text.setOrigin(0.5);

                button.x = (col - 2) / 3 * 0.45 * width;
                button.y = (row - 1) / 2 * 0.45 * height;

                button.add(sprite);
                button.add(text);
                button.alpha = 0;

                const x = inset(sprite.getBounds() as any, 16);

                sprite.setInteractive();

                sprite.on('pointerout', () => {
                    this.tweens.add({
                        targets: button,
                        scaleX: 1,
                        scaleY: 1,
                        duration: 100,
                        easing: "Cubic.easeOut"
                    });

                    this.sys.game.canvas.style.cursor = "default";
                });

                sprite.on('pointerover', () => {
                    this.tweens.add({
                        targets: button,
                        scaleX: 0.9,
                        scaleY: 0.9,
                        duration: 100,
                        easing: "Cubic.easeIn"
                    });

                    this.sys.game.canvas.style.cursor = "pointer";
                });

                sprite.on('pointerdown', () => {
                    this.tweens.add({
                        targets: button,
                        scaleX: 0.8,
                        scaleY: 0.8,
                        duration: 100,
                        easing: "Cubic.easeIn"
                    });
                });

                sprite.on('pointerup', () => {
                    this.tweens.add({
                        targets: button,
                        scaleX: 0.9,
                        scaleY: 0.9,
                        duration: 100,
                        easing: "Cubic.easeIn"
                    });

                    var transition = this.scene.transition({
                        target: 'level',
                        duration: 1000,
                        onUpdate: this.outro,
                        moveBelow: true,
                        data: { level }
                    });
                })

                buttons.push(button);
            }
        }

        this.buttonContainer = this.add.container(width / 2, height / 2, buttons);
    }

    public update(total: number, delta: number) {
        if (this.grid) {
            this.grid.tilePositionX = this.speed * total;
            this.grid.tilePositionY = this.speed * total;
        }
    }

    public transitioncomplete() {
        this.tweens.add({
            targets: this.titleText,
            y: 20,
            duration: 1500,
            ease: 'Elastic',
            easeParams: [1.1, 0.5]
        });

        if (this.buttonContainer) {
            for (let row = 0; row < this.size.rows; row++) {
                for (let col = 0; col < this.size.cols; col++) {
                    const btn = this.buttonContainer.getAt(row * this.size.cols + col) as Phaser.GameObjects.Container;
                    btn.alpha = 0;

                    this.tweens.add({
                        targets: btn,
                        alpha: 1,
                        duration: 250,
                        delay: col * 125
                    });
                }
            }
        }
    }

    private outro(progress: number) {
        this.speed = 0.05 + progress * progress * 0.15;

        if (this.titleText) this.titleText.alpha = max(0, 1 - progress * 1.7);
        if (this.buttonContainer) this.buttonContainer.alpha = max(0, 1 - progress * 1.7);
    }
}