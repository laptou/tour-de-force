import * as Phaser from "phaser";

const { sin, cos, random, PI, max } = Math;

export class TitleScene extends Phaser.Scene {

    private instructions: Phaser.GameObjects.Text | undefined;
    private logo: Phaser.GameObjects.Image | undefined;
    private grid: Phaser.GameObjects.TileSprite | undefined;
    private speed: number = 0.05;

    constructor() {
        super({ key: "title" });
    }

    public preload() {
        const game = this.sys.game;

        const graphics = this.make.graphics();

        graphics
            .fillStyle(0xFFFFFF)
            .fillRect(0, 0, 80, 80)
            .lineStyle(1, 0x000000, 1)
            .lineBetween(0, 0, 0, 16)
            .lineBetween(0, 0, 16, 0);

        graphics.generateTexture("tile", 16, 16);

        graphics.destroy();

        this.load.image("logo", require("@res/img/logo-stylized.png"));
    }

    public create() {
        const { width, height } = this.cameras.main;

        this.grid = this.add.tileSprite(width / 2, height / 2, width, height, "tile");
        this.logo = this.add.image(width / 2, height / 2, "logo");
        this.logo.setPipeline("add-color");

        this.instructions = this.add
            .text(width / 2, height / 2 + 100, "Click anywhere to start!")
            .setFontFamily("Montserrat Black")
            .setFontSize(32)
            .setFill("#EE0000")
            .setStroke("#FFFFFF", 10)
            .setShadow(0, 0, "#AAAAAA", 6, true, false);
        this.instructions.setOrigin(0.5);

        this.add
            .text(10, height - 10, "© 2018 Ibiyemi Abiodun")
            .setFontFamily("sans-serif")
            .setFill("#000000")
            .setFontSize(12)
            .setStroke("#FFFFFF", 10)
            .setOrigin(0, 1);

        this.input.once('pointerup', (event: any) => {
            this.scene.transition({
                target: 'level-select',
                duration: 1000,
                onUpdate: this.outro,
                moveBelow: true
            });
        });
    }

    public update(total: number, delta: number) {
        if (this.grid) {
            this.grid.tilePositionX = this.speed * total;
            this.grid.tilePositionY = this.speed * total;
        }

        if (this.logo) {
            const phase = (sin(total / 500 * PI) + 1) / 8;
            // this.logo.pipeline.setFloat4("uIntensity", phase, 0, 0, phase);
            this.logo.setOrigin(0.5 + random() / 100 - 0.005, 0.5 + random() / 100 - 0.005);
        }
    }

    private outro(progress: number) {
        this.speed = 0.05 + progress * progress * 0.15;

        if (this.logo) this.logo.alpha = max(0, 1 - progress * 1.7);
        if (this.instructions) this.instructions.alpha = max(0, 1 - progress * 1.7);
    }
}