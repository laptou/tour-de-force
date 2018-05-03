import { Button } from "@control/button";
import * as Phaser from "phaser";

const { sin, cos, random, PI, max, min } = Math;

enum CrateType {
    Wood = "wood", Steel = "steel", Aluminum = "aluminum"
}

enum Mode {
    View,
    Force
}

export class LevelScene extends Phaser.Scene {

    private level: any;
    private levelIndex!: number;

    private scale = 100; // 100px = 1m
    private pan = { x: 0, y: 0 };
    private mode = Mode.View;

    private hud!: Phaser.GameObjects.Container;
    private overlays!: Phaser.GameObjects.Graphics;
    private wood!: Phaser.Physics.Matter.Image;
    private grid!: Phaser.GameObjects.TileSprite;

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

        if (!("controls" in this.textures.list))
            this.load.spritesheet("controls", require("@res/img/control-sprites.png"), { frameWidth: 128, frameHeight: 128 });

        this.events.on("transitioncomplete", this.transitioncomplete, this);
    }

    public create() {
        const cam = this.cameras.main;
        const { height, width } = cam;

        // load the level
        this.level = require(`@res/level/${this.levelIndex}.json`);

        // set up camera and physics
        const gameWidth = this.level.size * 32, gameHeight = height - 100;

        cam.setBounds(-50, 0, gameWidth + 100, height);

        this.grid = this.add.tileSprite(gameWidth / 2, height / 2, gameWidth, gameHeight, "tile-32");
        this.grid.flipY = true;

        this.matter.world.setBounds(50, 50, gameWidth - 100, gameHeight);

        // add the tiles
        for (const tile of this.level.content) {
            this.addCrate(tile.x * 32, gameHeight - tile.y * 32, tile.type as CrateType);
        }


        // set up HUD
        this.overlays = this.add.graphics();

        this.hud = this.add.container(0, 0);

        this.hud.add(this.make.text({
            x: 50,
            y: height - 40,
            text: `Level ${this.levelIndex + 1}`,
            style: {
                fontFamily: "Clear Sans",
                fontStyle: "bold",
                fontSize: 24,
                fill: "black"
            }
        }));

        this.hud.add(new Button(this, {
            x: width - 50,
            y: height - 40,
            text: {
                text: "F",
                style: {
                    fontFamily: "Clear Sans",
                    fontStyle: "bold",
                    fontSize: 24,
                    fill: "white"
                }
            },
            sprite: {
                key: "controls",
                frame: 1,
                scale: 0.5
            },
            tooltip: {
                text: "Force Mode",
                style: {
                    fontFamily: "Clear Sans",
                    fontSize: 12,
                    fill: "white"
                }
            }
        }));

        this.hud.add(new Button(this, {
            x: width - 100,
            y: height - 40,
            text: {
                text: "KE",
                style: {
                    fontFamily: "Clear Sans",
                    fontStyle: "bold",
                    fontSize: 24,
                    fill: "white"
                }
            },
            sprite: {
                key: "controls",
                frame: 2,
                scale: 0.5
            },
            tooltip: {
                text: "Kinetic Energy Mode",
                style: {
                    fontFamily: "Clear Sans",
                    fontSize: 12,
                    fill: "white"
                }
            }
        }));
    }

    public update(total: number, delta: number) {
        const cam = this.cameras.main;
        const { height } = cam;
        const width = this.level.size * 32;

        // update camera

        if (this.hud) {
            const [cx, cy, tx, ty] = [this.hud.x, this.hud.y, cam.scrollX, cam.scrollY];

            this.hud.setPosition(
                tx - (tx - cx) * delta / 10000,
                ty - (ty - cy) * delta / 10000);
        }

        cam.scrollX += this.pan.x * delta;
        this.pan.x = min(5, this.pan.x + this.pan.x * delta / 1000);

        // update overlays if necessary
        // TODO: the "if necessary" part
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

    private pointermove(pointer: Phaser.Input.Pointer) {
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