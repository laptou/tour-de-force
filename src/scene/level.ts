import * as Phaser from "phaser";

const { sin, cos, random, PI, max, min } = Math;

enum CrateType {
    Wood, Steel, Aluminum
}

export class LevelScene extends Phaser.Scene {

    private level: any;
    private levelIndex: number = -1;
    private scale = 100; // 100px = 1m
    private pan = { x: 0, y: 0 };
    private overlays: Phaser.GameObjects.Graphics | undefined;
    private wood: Phaser.Physics.Matter.Image | undefined;
    private grid: Phaser.GameObjects.TileSprite | undefined;

    constructor() {
        super({ key: "level" });
    }

    public init(data: any) {
        console.log('init', data);

        this.levelIndex = data.level;
    }

    public preload() {
        if (!("tile-32" in this.textures.list)) {
            const graphics = this.make.graphics();

            graphics
                .fillStyle(0xFFFFFF)
                .fillRect(0, 0, 80, 80)
                .lineStyle(1, 0x000000, 1)
                .lineBetween(0, 0, 0, 32)
                .lineBetween(0, 0, 32, 0);

            graphics.generateTexture("tile-32", 32, 32);

            graphics.destroy();
        }

        if (!("sprites" in this.textures.list))
            this.load.spritesheet("sprites", require("@res/img/item-sprites.png"), { frameWidth: 128, frameHeight: 128 });

        this.events.on("transitioncomplete", this.transitioncomplete, this);
    }

    public create() {
        const cam = this.cameras.main;
        const { height } = cam;

        this.level = require(`@res/level/${this.levelIndex}.json`);
        const width = this.level.size * 32;

        cam.setBounds(-50, 0, width + 100, height);

        const self = this as any;

        this.grid = this.add.tileSprite(width / 2, height / 2, width, height - 100, "tile-32");
        this.grid.flipY = true;

        this.matter.world.setBounds(50, 50, width - 100, height - 100);

        this.wood = this.addCrate(128, 512, CrateType.Wood);

        this.input.on("pointermove", this.onmove, this);

        const levelText = this.add.text(50, height - 40, `Level ${this.levelIndex + 1}`, {
            fontFamily: "Clear Sans",
            fontStyle: "bold",
            fontSize: 24,
            fill: "black"
        });

        this.overlays = this.add.graphics();
    }

    public update(total: number, delta: number) {
        const cam = this.cameras.main;
        const { height } = cam;
        const width = this.level.size * 32;

        cam.scrollX += this.pan.x * delta;

        if (this.overlays) {
            this.overlays.clear();

            this.overlays.fillStyle(0xFFFFFF);
            this.overlays.fillRect(0, 0, width, 50);
            this.overlays.fillRect(0, height - 50, width, 50);
            this.overlays.lineStyle(4, 0);
            this.overlays.strokeRect(0, 50, width, height - 100);
        }
    }

    public transitioncomplete() {
    }

    private onmove(pointer: Phaser.Input.Pointer) {
        const cam = this.cameras.main;
        const { width, height } = cam;

        if (pointer.position.x > width - 50)
            this.pan.x = 1;
        else if (pointer.position.x < 50)
            this.pan.x = -1;
        else
            this.pan.x = 0;
    }

    private addCrate(x: number, y: number, crateType: CrateType) {
        let body: Matter.Body;
        let sprite: Phaser.GameObjects.Image;
        let mass: number, inertia: number;

        switch (crateType) {
            case CrateType.Wood:
                sprite = this.add.image(x, y, "sprites", 5);
                mass = 75;
                inertia = 100;
                break;
            case CrateType.Steel:
                sprite = this.add.image(x, y, "sprites", 6);
                mass = 120;
                inertia = 200;
                break;
            case CrateType.Aluminum:
                sprite = this.add.image(x, y, "sprites", 7);
                mass = 75;
                inertia = 120;
                break;
            default:
                throw new Error("Invalid crate type.");
        }

        const matterObj = this.matter.add.gameObject(sprite, { shape: { chamfer: { radius: 16 } }, mass });

        return matterObj as Phaser.Physics.Matter.Image;
    }

    private outro(progress: number) {
    }
}