import { Button } from "@control/button";
import { LevelOutcome } from "@scene/level/banner";
import * as Phaser from "phaser";

const { sin, cos, random, PI, max } = Math;

export class LevelSelectScene extends Phaser.Scene {

    private btnGrid!: Phaser.GameObjects.Container;
    private title!: Phaser.GameObjects.Text;
    private grid!: Phaser.GameObjects.TileSprite;
    private speed: number = 0.05;
    private size = { rows: 3, cols: 5 };

    private initialized = false;

    constructor() {
        super({ key: "level-select" });
    }

    public init(data: any) {
        if (data) {
            const level: number = data.level;
            const outcome: LevelOutcome | undefined = data.outcome;

            if (level && outcome) {

            }
        }
    }

    public preload() {
        this.events.on("transitioncomplete", this.transitioncomplete, this);

        this.load.spritesheet("controls", require("@res/img/control-sprites.png"), { frameWidth: 128, frameHeight: 128 });
    }

    public create() {
        if (this.initialized) return;

        const { width, height } = this.cameras.main;
        const self = this as any;

        if (this.grid)
            this.grid.destroy();

        this.grid = this.add.tileSprite(width / 2, height / 2, width, height, "tile-16");

        if (this.title)
            this.title.destroy();

        this.title =
            this.add.text(20, -50, "Choose a level")
                .setFontFamily("Montserrat Black")
                .setFontSize(32)
                .setFill("#EE0000")
                .setStroke("#FFFFFF", 10)
                .setShadow(0, 0, "#AAAAAA", 6, true, false);

        if (this.btnGrid)
            this.btnGrid.destroy();

        const buttons: Phaser.GameObjects.GameObject[] = [];

        for (let row = 0; row < this.size.rows; row++) {
            for (let col = 0; col < this.size.cols; col++) {
                const level = row * this.size.cols + col;

                const button = new Button(this, {
                    text: {
                        style: {
                            fontFamily: "Montserrat Black",
                            fontSize: 32,
                            fill: "#FFFFFF"
                        },
                        text: (level + 1).toString(10)
                    },
                    sprite: {
                        key: "controls",
                        frame: 0
                    }
                });

                button.x = (col - 2) / 3 * 0.45 * width;
                button.y = (row - 1) / 2 * 0.45 * height;
                button.alpha = 0;

                button.on('pointerup', () => {
                    this.goto(level);
                })

                buttons.push(button);
            }
        }

        this.btnGrid = this.add.container(width / 2, height / 2, buttons);

        this.input.keyboard.on("keydown_T", () => {
            this.goto(15);
        })
    }

    public goto(level: number) {
        var transition = this.scene.transition({
            target: 'level',
            duration: 1000,
            onUpdate: this.outro,
            moveBelow: true,
            data: { level }
        });
    }

    public update(total: number, delta: number) {
        if (this.grid) {
            this.grid.tilePositionX = this.speed * total;
            this.grid.tilePositionY = this.speed * total;
        }
    }

    public transitioncomplete() {
        this.tweens.add({
            targets: this.title,
            y: 20,
            duration: 1500,
            ease: 'Elastic',
            easeParams: [1.1, 0.5]
        });

        if (this.btnGrid) {
            for (let row = 0; row < this.size.rows; row++) {
                for (let col = 0; col < this.size.cols; col++) {
                    const btn = this.btnGrid.getAt(row * this.size.cols + col) as Button;
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

        if (this.title) this.title.alpha = max(0, 1 - progress * 1.7);
        if (this.btnGrid) this.btnGrid.alpha = max(0, 1 - progress * 1.7);
    }
}