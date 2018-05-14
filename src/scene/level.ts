import { Button } from "@control/button";
import * as Phaser from "phaser";

import { Ray, vector } from "../util";

const { sin, cos, random, PI, max, min, abs } = Math;

enum TileType {
    Wood = "wood", Steel = "steel", Aluminum = "aluminum"
}

enum GameMode {
    View,
    Force,
    KineticEnergy
}

enum ControlAlignment {
    Left = 1,
    Right = 2,
    Center = 4,
    Top = 8,
    Bottom = 16
}

interface TileConfig {
    x?: number;
    y?: number;
    type: TileType;
}

interface HudButtonConfig {
    text: string;
    tooltip: string;
    sprite: string;
    frame: number;

    align?: ControlAlignment;
    offset?: { x: number, y: number };
    handler?: Function;
}

interface ModeHudButtonConfig extends HudButtonConfig {
    grey?: boolean;
    mode: GameMode;
}

class Tile extends Phaser.GameObjects.Sprite {
    constructor(scene: Phaser.Scene, config: TileConfig) {
        let frame: number;
        let mass: number;

        switch (config.type) {
            case TileType.Wood:
                frame = 5;
                mass = 75;
                break;
            case TileType.Steel:
                frame = 6;
                mass = 120;
                break;
            case TileType.Aluminum:
                frame = 7;
                mass = 100;
                break;
            default:
                throw new Error("Invalid crate type.");
        }

        super(scene,
            config ? config.x || 0 : 0,
            config ? config.y || 0 : 0,
            "sprites", frame);

        const matterObj = scene.matter.add.gameObject(this, { shape: { chamfer: { radius: 16 } }, mass });
        matterObj.type = "tile";
        matterObj.setInteractive();
    }
}

export class LevelScene extends Phaser.Scene {

    private level: any;
    private levelIndex!: number;

    private scale = 100; // 100px = 1m
    private pan = { x: 0, y: 0 };
    private mode = GameMode.View;
    private ray?: Ray;
    private dirty = false;

    private target?: Tile;

    private hud!: Phaser.GameObjects.Container;
    private overlays!: Phaser.GameObjects.Graphics;
    private tileContainer!: Phaser.GameObjects.Container;
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
            const graphics = this.make.graphics({}, false);

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

    }

    public create() {
        const cam = this.cameras.main;
        const { height, width } = cam;

        // load the level
        this.level = require(`@res/level/${this.levelIndex || 0}.json`);

        // set up camera and physics
        const gameWidth = this.level.size * 32, gameHeight = height - 100;

        cam.setBounds(-50, 0, gameWidth + 100, height);

        this.grid = this.add.tileSprite(gameWidth / 2, height / 2, gameWidth, gameHeight, "tile-32");
        this.grid.flipY = true;

        this.matter.world.setBounds(50, 50, gameWidth - 100, gameHeight);

        // add the tiles
        this.tileContainer = this.make.container({});

        for (const tile of this.level.content) {
            this.tileContainer.add(this.addTile(tile.x * 32, gameHeight - tile.y * 32, tile.type as TileType));
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

        this.hud.add(this.makeModeHudButton({
            sprite: "controls",
            frame: 1,
            offset: { x: 100, y: 40 },
            text: "F",
            tooltip: "Force Mode",
            mode: GameMode.Force
        }));

        this.hud.add(this.makeModeHudButton({
            sprite: "controls",
            frame: 2,
            offset: { x: 150, y: 40 },
            text: "KE",
            tooltip: "Kinetic Energy Mode",
            mode: GameMode.KineticEnergy
        }));

        this.input.on("pointermove", this.onPointerMove, this);
        this.input.on("pointerup", this.onPointerUp, this);

        this.dirty = true;
    }

    public update(total: number, delta: number) {
        const cam = this.cameras.main;
        const { height } = cam;
        const width = this.level.size * 32;

        // update camera

        if (this.hud) {
            const [cx, cy, tx, ty] = [this.hud.x, this.hud.y, cam.scrollX, cam.scrollY];
            if (cx != tx || cy != ty)
                this.hud.setPosition(
                    tx - (tx - cx) * delta / 10000,
                    ty - (ty - cy) * delta / 10000);
        }

        cam.scrollX += this.pan.x * delta;
        this.pan.x = min(5, this.pan.x + this.pan.x * delta / 1000);

        this.overlays.setPosition(cam.scrollX, cam.scrollY);

        // update overlays if necessary
        if (this.overlays && this.dirty) {
            this.overlays.clear();

            this.overlays.fillStyle(0xFFFFFF);
            this.overlays.fillRect(0, 0, width, 50);
            this.overlays.fillRect(0, height - 50, width, 50);
            this.overlays.lineStyle(4, 0);
            this.overlays.strokeRect(0, 50, width, height - 100);

            if (this.ray) {
                let color;
                let unit;

                switch (this.mode) {
                    case GameMode.Force:
                        color = 0x800000;
                        unit = `${this.ray.length / 10} N`;
                        break;
                    default:
                        color = 0;
                        break;
                }

                this.overlays.lineStyle(4, color);
                this.overlays.lineBetween(this.ray.x1, this.ray.y1, this.ray.x2, this.ray.y2);

                const point = this.ray.plus(10).end;
                const dir = this.ray.unit.times(10).direction;
                const p1 = vector.add(this.ray.end, { x: dir.y, y: -dir.x });
                const p2 = vector.add(this.ray.end, { x: -dir.y, y: dir.x });

                this.overlays.fillStyle(color, 1);
                this.overlays.fillTriangle(
                    point.x, point.y,
                    p2.x, p2.y,
                    p1.x, p1.y,
                );

                if (unit) {

                }
            }
            this.dirty = false;
        }
    }

    public setMode(mode: GameMode) {
        this.mode = mode;
        this.events.emit("update:mode");
    }

    private onPointerUp(pointer: Phaser.Input.Pointer, x: number, y: number) {
        if (this.ray) {
            if (this.target) {
                const body = this.target as any as Phaser.Physics.Matter.Components.Force;
                const s = this.ray.source;
                const d = this.ray.times(0.1).direction;

                body.applyForceFrom(
                    new Phaser.Math.Vector2(s.x, s.y),
                    new Phaser.Math.Vector2(d.x, d.y)
                );
            }

            this.ray = undefined;
            this.dirty = true;
        }

    }

    private onPointerMove(pointer: Phaser.Input.Pointer) {
        if (this.ray) {
            this.ray.direction = vector.sub(pointer.position, this.ray.source);
            this.dirty = true;
            return;
        }

        const cam = this.cameras.main;
        const { width, height } = cam;

        if (pointer.position.x > width - 50)
            this.pan.x = 1;
        else if (pointer.position.x < 50)
            this.pan.x = -1;
        else
            this.pan.x = 0;
    }

    private addTile(x: number, y: number, crateType: TileType): Tile {
        const tile = new Tile(this, { x, y, type: crateType });

        tile.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
            switch (this.mode) {
                case GameMode.Force:
                    this.target = tile;
                    this.ray = new Ray(pointer, { x: 0, y: 0 });
                    this.dirty = true;
                    break;
            }
        });

        return tile;
    }

    private makeModeHudButton(config: ModeHudButtonConfig) {
        const c = {
            align: ControlAlignment.Right | ControlAlignment.Bottom,
            grey: true,
            ...config
        };

        const btn = this.makeHudButton(c);

        if (c.grey) {
            btn.sprite.setPipeline("greyscale");

            btn.on("pointerover", () => {
                btn.sprite.resetPipeline();
            });

            btn.on("pointerdown", () => {
                this.setMode(c.mode);
            });

            btn.on("pointerout", () => {
                if (c.mode !== this.mode)
                    btn.sprite.setPipeline("greyscale");
            });

            this.events.on("update:mode", () => {
                if (c.mode !== this.mode) btn.sprite.setPipeline("greyscale");
                else btn.sprite.resetPipeline();
            });
        }

        return btn;
    }

    private makeHudButton(config: HudButtonConfig) {
        const { height, width } = this.cameras.main;

        const c = {
            align: ControlAlignment.Left,
            ...config
        };

        let offset = c.offset || { x: 0, y: 0 };

        if ((c.align & ControlAlignment.Right) === ControlAlignment.Right)
            offset = { x: width - offset.x, y: offset.y };

        if ((c.align & ControlAlignment.Bottom) === ControlAlignment.Bottom)
            offset = { x: offset.x, y: height - offset.y };

        const btn = new Button(this, {
            ...offset,
            text: {
                text: c.text,
                style: {
                    fontFamily: "Clear Sans",
                    fontStyle: "bold",
                    fontSize: 24,
                    fill: "white"
                }
            },
            sprite: {
                key: c.sprite,
                frame: c.frame,
                scale: 0.5
            },
            tooltip: {
                text: c.tooltip,
                style: {
                    fontFamily: "Clear Sans",
                    fontSize: 12,
                    fill: "white"
                }
            }
        });

        if (c.handler) btn.on("pointerdown", c.handler);

        return btn;
    }

    private outro(progress: number) {
    }
}