import { Button } from "@control/button";
import { clamp, Ray, vector } from "@util";
import * as Phaser from "phaser";

import { Tile, TileConfig } from "./tile";
import { ControlAlignment, GameMode, HudButtonConfig, ModeHudButtonConfig } from "./ui";

const { sin, cos, random, PI, max, min, abs } = Math;

export class LevelScene extends Phaser.Scene {

    private level: any;
    private levelIndex!: number;

    private scale = 100; // 100px = 1m
    private pan = { x: 0, y: 0 };
    private mode = GameMode.View;
    private ray?: Ray;
    private dirty = false;

    private target?: Tile;
    private track?: Tile;

    private info!: Phaser.GameObjects.Text;
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
        if (!("tile-level" in this.textures.list)) {
            const graphics = this.make.graphics({}, false);

            graphics
                .fillStyle(0xFFFFFF)
                .fillRect(0, 0, 80, 80)
                .lineStyle(3, 0x000000, 1)
                .lineBetween(0, 0, 0, 128)
                .lineBetween(0, 0, 128, 0)
                .lineStyle(1, 0x000000, 1)
                .lineBetween(32, 0, 32, 128)
                .lineBetween(0, 32, 128, 32)
                .lineBetween(64, 0, 64, 128)
                .lineBetween(0, 64, 128, 64)
                .lineBetween(96, 0, 96, 128)
                .lineBetween(0, 96, 128, 96);

            graphics.generateTexture("tile-level", 128, 128);

            graphics.destroy();
        }

        if (!("sprites" in this.textures.list))
            this.load.spritesheet("sprites", require("@res/img/item-sprites.png"), { frameWidth: 128, frameHeight: 128 });

        if (!("controls" in this.textures.list))
            this.load.spritesheet("controls", require("@res/img/control-sprites.png"), { frameWidth: 128, frameHeight: 128 });

    }

    public create() {
        this.createWorld();

        this.createHUD();

        this.input.on("pointermove", this.onPointerMove, this);
        this.input.on("pointerup", this.onPointerUp, this);

        this.dirty = true;
    }

    public update(total: number, delta: number) {
        const cam = this.cameras.main;
        const { height, width } = cam;
        const gameWidth = this.level.size * 32;

        // update camera

        if (this.track) {
            cam.scrollX = this.track.x - width / 2;
            // cam.scrollY = this.track.y;
        }

        const clampedX = clamp(-50, cam.scrollX, gameWidth + 50);

        this.hud.setPosition(clampedX, cam.scrollY);
        this.overlays.setPosition(clampedX, cam.scrollY);

        // update overlays if necessary
        if (this.overlays && this.dirty) {
            this.overlays.clear();

            if (this.target && this.ray) {
                let color;
                let unit;
                const body = this.target.body as Matter.Body;

                switch (this.mode) {
                    case GameMode.Force:
                        color = 0x800000;

                        const force = this.ray.length / 10;

                        const momentum =
                            `F (${force.toPrecision(3)} N) × ` +
                            `Δt (1/60 s) = ` +
                            `Δρ (${(force / 60).toPrecision(3)} kg ⋅ m / s)`;

                        const acceleration =
                            `F (${force.toPrecision(3)} N) / ` +
                            `m (${body.mass} kg) = ` +
                            `a (${force / body.mass} m/s²)`

                        unit = [momentum, acceleration].join("\n");

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

                this.info.text = unit || "";
                this.info.updateText();
            }
            this.dirty = false;
        }
    }

    public setMode(mode: GameMode) {
        this.mode = mode;
        this.events.emit("update:mode");
    }

    private createWorld() {
        const cam = this.cameras.main;
        const { height, width } = cam;

        // load the level
        this.level = require(`@res/level/${0}.json`);

        // set up camera and physics
        const gameWidth = this.level.size * 32, gameHeight = height - 100;

        cam.setBounds(-50, 0, gameWidth + 100, height);

        this.grid = this.add.tileSprite(gameWidth / 2, height / 2, gameWidth, gameHeight, "tile-level");
        this.grid.flipY = true;

        this.matter.world.setBounds(50, 50, gameWidth - 100, gameHeight);

        // add the tiles
        this.tileContainer = this.make.container({});

        for (const config of this.level.content) {
            const tile = this.addTile(config as TileConfig);

            if (config.track)
                this.track = tile;

            this.tileContainer.add(tile);
        }
    }

    private createHUD() {
        const cam = this.cameras.main;
        const { height, width } = cam;

        this.overlays = this.add.graphics();

        this.hud = this.add.container(0, 0);

        // current level
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

        // information
        this.hud.add(this.info = this.make.text({
            x: width / 2,
            y: height - 20,
            text: "",
            origin: 0.5,
            style: {
                fontFamily: "Clear Sans",
                fontStyle: "bold",
                fontSize: 14,
                fill: "black"
            }
        }))

        // mode buttons
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
    }

    private onPointerUp(pointer: Phaser.Input.Pointer, x: number, y: number) {
        if (this.ray) {
            if (this.target) {
                const body = this.target as any as Phaser.Physics.Matter.Components.Force;
                const s = this.ray.source;
                const d = this.ray.times(0.01).direction;

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
    }

    private addTile(config: TileConfig): Tile {
        const tile = new Tile(this, config);

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

    // #region factory functions

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

    // #endregion

    private outro(progress: number) {
    }
}