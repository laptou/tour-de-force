import { clamp, fixed, precision, Ray, units, vector } from "@util";
import * as Phaser from "phaser";

import { Text } from "../../config";
import { Tile, TileConfig } from "./tile";
import { ControlAlignment, GameMode, HudButton, HudButtonConfig, ModeHudButtonConfig } from "./ui";

const { sin, cos, random, PI, max, min, abs } = Math;

export class LevelScene extends Phaser.Scene {

    private level: any;
    private levelIndex!: number;

    private scale = 100; // 100px = 1m
    private pan = { x: 0, y: 0 };
    private mode = GameMode.Force;
    private ray?: Ray;
    private dirty = false;

    private target?: Tile;
    private track?: Tile;

    private actionInfo!: Phaser.GameObjects.Text;
    private targetInfo!: Phaser.GameObjects.Text;

    private labels!: { ray?: { x: Phaser.GameObjects.Text; y: Phaser.GameObjects.Text; } };

    private hud!: Phaser.GameObjects.Container;
    private frame!: Phaser.GameObjects.Graphics;
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

        const clampedX = clamp(-50, cam.scrollX, gameWidth + 50 - width);

        this.frame.setPosition(clampedX, cam.scrollY);
        this.hud.setPosition(clampedX, cam.scrollY);
        this.overlays.setPosition(clampedX, cam.scrollY);


        // update overlays if necessary
        if (this.overlays && this.dirty) {
            this.overlays.clear();

            this.actionInfo.text = "";

            if (this.target && this.ray) {
                let color;
                let unit;
                const body = this.target.body as Matter.Body;

                switch (this.mode) {
                    case GameMode.Force:
                        color = 0x800000;

                        // velocity is in pixels per timestep (1/60s)
                        // so all other units need to be divided accordingly

                        const time = new units.Measurement(1 / 60, units.Time.Second);
                        const mass = new units.Measurement(body.mass, units.Mass.Kilogram);
                        const force = new units.Measurement(this.ray.length, units.Force.Newton).times(100);

                        // const impulse = force.times(time);
                        const accel = force.over(mass);
                        const velo = accel.times(time);

                        // const momentum = precision(3) `F (${force}) × Δt (1/60 s) = Δρ (${impulse})`;
                        const acceleration = precision(3) `F (${force}) / m (${mass}) = a (${accel})`;
                        const velocity = precision(3) `a (${accel}) × Δt (1/60 s) = Δv (${velo})`;

                        unit = [acceleration, velocity].join("\n");



                        break;
                    default:
                        color = 0;
                        break;
                }



                this.overlays.lineStyle(4, color);

                this.overlays.lineBetween(this.ray.x1, this.ray.y1, this.ray.x2, this.ray.y2);

                this.overlays.lineStyle(3, color, 0.6);

                this.overlays.lineBetween(this.ray.x1, this.ray.y1, this.ray.x2, this.ray.y1);
                this.overlays.lineBetween(this.ray.x2, this.ray.y1, this.ray.x2, this.ray.y2);

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

                this.actionInfo.text = unit || "";
            }

            this.actionInfo.updateText();

            this.dirty = false;
        }

        if (this.target) {
            const body = this.target.body as Matter.Body;

            this.targetInfo.setBackgroundColor("#FFFFFF");

            const m = new units.Measurement(body.mass, units.Mass.Kilogram);

            // 100px = 1m
            const x =
                new units.VectorMeasurement(this.target, units.Distance.Pixel)
                    .to(units.Distance.Meter);

            const v =
                new units.VectorMeasurement(body.velocity, units.pixelsPerStep)
                    .to(units.Distance.Meter, units.Time.Second);

            const theta = new units.Measurement(this.target.angle, units.Angle.Degree);

            const omega =
                new units.Measurement(body.angularVelocity, new units.Unit(units.Angle.Degree, units.Time.Step))
                    .to(units.Angle.Degree, units.Time.Second);

            this.targetInfo.setText([
                fixed(1) `m: ${m}`,
                fixed(1) `x: ${x}`,
                fixed(1) `v: ${v}`,
                fixed(1) `θ: ${theta}`,
                fixed(1) `ω: ${omega}`,
            ]);
        }

        if (this.ray && this.labels.ray) {
            const { source, direction: mag } = this.ray;
            const offset = vector.div(mag, 2);

            this.labels.ray.x.setPosition(clampedX + source.x + offset.x, source.y);
            this.labels.ray.y.setPosition(clampedX + source.x + mag.x, source.y + offset.y);
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

        this.matter.world.setBounds(50, 50, gameWidth - 100, gameHeight, 512);
        const walls = this.matter.world.walls as { left: Matter.Body; right: Matter.Body; top: Matter.Body; bottom: Matter.Body };

        walls.top.friction = 0;
        walls.top.restitution = 0;

        walls.bottom.friction = 0;
        walls.bottom.restitution = 0;

        walls.left.friction = 0;
        walls.left.restitution = 0;

        walls.right.friction = 0;
        walls.right.restitution = 0;

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

        this.frame = this.add.graphics()
            .fillStyle(0xFFFFFF)
            .fillRect(0, 0, 50, height)
            .fillRect(width - 50, 0, 50, height)
            .fillRect(50, 0, width - 100, 50)
            .fillRect(50, height - 50, width - 100, 50)
            .lineStyle(4, 0x000000)
            .strokeRect(48, 48, width - 96, height - 96);

        this.overlays = this.add.graphics();
        this.labels = {};

        this.hud = this.add.container(0, 0);

        // current level
        this.hud.add(this.make.text({
            x: 50,
            y: height - 40,
            text: `Level ${(this.levelIndex || 0) + 1}`,
            style: Text.Header
        }));

        // information
        this.hud.add(this.actionInfo = this.make.text({
            x: width / 2,
            y: height - 20,
            text: "",
            origin: 0.5,
            style: Text.Normal.Light
        }));

        this.hud.add(this.targetInfo = this.make.text({
            x: width - 50,
            y: 100,
            text: "",
            origin: { x: 1, y: 0 },
            backgroundColor: "white",
            padding: 10,
            style: Text.Normal.Light
        }));

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

    private createRay(x: number, y: number) {
        this.ray = new Ray({ x, y }, { x: 0, y: 0 });
        this.labels.ray = {
            x: this.add.text(x, y, `${new units.Measurement(0, units.Force.Newton)}`,
                {
                    style: { fontWeight: "bold", ...Text.Normal.Dark },
                    backgroundColor: "#000000",
                    origin: 0.5,
                    padding: 5,
                    alpha: 0
                }).setOrigin(0.5) as Phaser.GameObjects.Text,
            y: this.add.text(x, y, `${new units.Measurement(0, units.Force.Newton)}`,
                {
                    style: { fontWeight: "bold", ...Text.Normal.Dark },
                    backgroundColor: "black",
                    origin: 0.5,
                    padding: 5,
                    alpha: 0
                }).setOrigin(0.5) as Phaser.GameObjects.Text
        }

        this.dirty = true;
    }

    private updateRay(x: number, y: number) {
        if (this.ray) {
            let mag = vector.sub({ x, y }, this.ray.source);
            mag = mag.times(Math.min(1, 300 / mag.length()));
            this.ray.direction = mag;

            if (this.labels.ray) {
                const offset = vector.div(mag, 2);
                const source = this.ray.source;
                const alpha = Math.min(1, mag.length() / 50);
                const camera = this.cameras.main;

                this.labels.ray.x.setText(new units.Measurement(mag.x, units.Force.Newton).toFixed(1));
                this.labels.ray.x.setAlpha(alpha);

                this.labels.ray.y.setText(new units.Measurement(mag.y, units.Force.Newton).toFixed(1));
                this.labels.ray.y.setAlpha(alpha);
            }

            this.dirty = true;
        }
    }

    private activateRay() {
        if (this.ray && this.target) {
            const body = this.target as any as Phaser.Physics.Matter.Components.Force;
            const s = this.ray.source;
            const d = this.ray.times(0.01).direction;

            const mag = new Phaser.Math.Vector2(d.x, d.y);

            body.applyForceFrom(
                new Phaser.Math.Vector2(s.x, s.y),
                mag.scale(Math.min(1, 300 / mag.length()))
            );
        }
    }

    private destroyRay() {
        this.ray = undefined;
        if (this.labels.ray) {
            this.labels.ray.x.destroy();
            this.labels.ray.y.destroy();

            this.labels.ray = undefined;
        }
        this.dirty = true;
    }

    private onPointerUp(pointer: Phaser.Input.Pointer, x: number, y: number) {
        this.activateRay();
        this.destroyRay();
    }

    private onPointerMove(pointer: Phaser.Input.Pointer) {
        this.updateRay(pointer.x, pointer.y);
    }

    private addTile(config: TileConfig): Tile {
        const tile = new Tile(this, config);

        tile.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
            switch (this.mode) {
                case GameMode.Force:
                    this.target = tile;
                    this.createRay(pointer.x, pointer.y);
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
            if (this.mode !== c.mode)
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
        return new HudButton(this, config);
    }

    // #endregion
}