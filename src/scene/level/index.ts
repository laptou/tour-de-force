import { GameMode, LevelData } from "@lib/level";
import { ControlAlignment, HudButton, HudButtonConfig, ModeHudButtonConfig } from "@scene/util/ui";
import { clamp, fixed, precision, Ray, Vector } from "@util/math";
import {
    Angle,
    AngularVelocity,
    Distance,
    Force,
    Mass,
    Measurement,
    Time,
    Unit,
    VectorMeasurement,
    Velocity,
} from "@util/measurement";
import * as Phaser from "phaser";

import { Text } from "../../config";
import { Tile, TileConfig } from "./tile";

const { sin, cos, random, PI, max, min, abs } = Math;

export class LevelScene extends Phaser.Scene {

    private level!: LevelData | number;

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

        this.level = data.level;
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

        this.loadWorld();

        this.input.on("pointermove", this.onPointerMove, this);
        this.input.on("pointerup", this.onPointerUp, this);

        this.dirty = true;
    }

    public update(total: number, delta: number) {
        const cam = this.cameras.main;
        const { height, width } = cam;
        const gameWidth = (this.level as LevelData).size * 32;

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
                let info;
                const body = this.target.body as Matter.Body;

                switch (this.mode) {
                    case GameMode.Force:
                        color = 0x800000;

                        {
                            // velocity is in pixels per timestep (1/60s)
                            // so all other units need to be divided accordingly

                            const time = new Measurement(1 / 60, Time.Second);
                            const mass = new Measurement(body.mass, Mass.Kilogram);
                            const force = this.queryRay().magnitude();

                            const accel = force.over(mass);
                            const velo = accel.times(time);

                            const acceleration = precision(3) `F (${force}) / m (${mass}) = a (${accel})`;
                            const velocity = precision(3) `a (${accel}) × Δt (1/60 s) = Δv (${velo})`;

                            info = [acceleration, velocity].join("\n");
                        }

                        break;

                    case GameMode.Velocity:
                        color = 0x006ad1;

                        {

                            const mass = new Measurement(body.mass, Mass.Kilogram);
                            const velo = this.queryRay().magnitude();

                            const momentum = precision(3) `m (${mass}) * v (${velo}) = ρ (${velo.times(mass)})`;

                            info = [momentum].join("\n");
                        }

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
                const p1 = Vector.add(this.ray.end, { x: dir.y, y: -dir.x });
                const p2 = Vector.add(this.ray.end, { x: -dir.y, y: dir.x });

                this.overlays.fillStyle(color, 1);
                this.overlays.fillTriangle(
                    point.x, point.y,
                    p2.x, p2.y,
                    p1.x, p1.y,
                );

                this.actionInfo.text = info || "";
            }

            this.actionInfo.updateText();

            this.dirty = false;
        }

        if (this.target) {
            const body = this.target.body as Matter.Body;

            this.targetInfo.setBackgroundColor("#FFFFFF");

            const m = new Measurement(body.mass, Mass.Kilogram);

            // 100px = 1m
            const x =
                new VectorMeasurement(this.target, Distance.Pixel)
                    .to(Distance.Meter);

            const v =
                new VectorMeasurement(body.velocity, Velocity.PixelsPerStep)
                    .to(Velocity.MetersPerSecond);

            const theta =
                new Measurement(this.target.angle, Angle.Degree)
                    .to(Angle.Radian);

            const omega =
                new Measurement(body.angularVelocity, AngularVelocity.DegreesPerStep)
                    .to(AngularVelocity.RadiansPerSecond);

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
            const offset = Vector.div(mag, 2);

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
        this.level = require(`@res/level/${0}.json`) as LevelData;

        // set up camera and physics
        const gameWidth = this.level.size * 32, gameHeight = height - 100;

        cam.setBounds(-50, 0, gameWidth + 100, height);

        this.grid = this.add.tileSprite(gameWidth / 2, height / 2, gameWidth, gameHeight, "tile-level");
        this.grid.flipY = true;

        this.matter.world.setBounds(0, 50, gameWidth, gameHeight, 512);
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
            text: `Level ${(this.level as LevelData).index + 1}`,
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
        }).setName(GameMode.Force));

        this.hud.add(this.makeModeHudButton({
            sprite: "controls",
            frame: 5,
            offset: { x: 150, y: 40 },
            text: "V",
            tooltip: "Velocity Mode",
            mode: GameMode.Velocity
        }).setName(GameMode.Velocity));

        this.hud.add(this.makeModeHudButton({
            sprite: "controls",
            frame: 3,
            offset: { x: 200, y: 40 },
            text: "M",
            tooltip: "Mass Mode",
            mode: GameMode.Mass
        }).setName(GameMode.Mass));
    }

    private loadWorld() {
        if (typeof this.level === "number") return;

        for (const mode of [GameMode.Mass, GameMode.Velocity, GameMode.Force]) {
            if (this.level.modes.indexOf(mode) === -1) {
                const btn = this.hud.getByName(mode) as HudButton;
                btn.setVisible(false);
                btn.setActive(false);
            }
        }

        for (const config of this.level.content) {
            const tile = this.addTile(config as TileConfig);

            if (config.track)
                this.track = tile;

            this.tileContainer.add(tile);
        }
    }

    private createRay(x: number, y: number) {
        this.ray = new Ray({ x, y }, { x: 0, y: 0 });
        this.labels.ray = {
            x: this.add.text(x, y, `${new Measurement(0, Force.Newton)}`,
                {
                    style: { fontWeight: "bold", ...Text.Normal.Dark },
                    backgroundColor: "#000000",
                    origin: 0.5,
                    padding: 5,
                    alpha: 0
                }).setOrigin(0.5) as Phaser.GameObjects.Text,
            y: this.add.text(x, y, `${new Measurement(0, Force.Newton)}`,
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

    private queryRay(): VectorMeasurement {
        if (!this.ray)
            return VectorMeasurement.zero;

        let unit: Unit = Unit.scalar;
        let factor = 1;

        switch (this.mode) {
            case GameMode.Force:
                unit = new Unit(Force.Newton);
                factor = 100; // for display, arrow units are 100 * N
                break;
            case GameMode.Velocity:
                unit = Velocity.MetersPerSecond;
                factor = 1 / 30; // max 10 m/s
                break;
        }

        return new VectorMeasurement(Vector.mult(this.ray.direction, factor), unit);
    }

    private updateRay(x: number, y: number) {
        if (this.ray) {
            let d = Vector.sub({ x, y }, this.ray.source);
            let dlen = d.length();
            d = d.times(Math.min(1, 300 / dlen));

            this.ray.direction = d;

            if (this.labels.ray) {
                const offset = Vector.div(d, 2);
                const source = this.ray.source;
                const alpha = Math.min(1, dlen / 50);
                const camera = this.cameras.main;

                const vec = this.queryRay();

                this.labels.ray.x.setText(new Measurement(vec.x, vec.unit).toPrecision(3));
                this.labels.ray.x.setAlpha(alpha);

                this.labels.ray.y.setText(new Measurement(vec.y, vec.unit).toPrecision(3));
                this.labels.ray.y.setAlpha(alpha);
            }

            this.dirty = true;
        }
    }

    private activateRay() {
        if (this.ray && this.target) {
            const body = this.target as any as Phaser.Physics.Matter.Components.Force & Phaser.Physics.Matter.Components.Velocity;

            const s = new VectorMeasurement(this.ray.source, Distance.Meter);
            const d = this.ray.direction;

            switch (this.mode) {
                case GameMode.Force:
                    // gonna treat the arrow length as 100 * matter-newton   
                    let force = new VectorMeasurement(Vector.div(d, 100), Force.PixelNewton);

                    // maximum 3 matter-newton = 300 N
                    force = force.times(Math.min(1, 3 / force.length()));

                    // kg * px / s^2 is matterjs's internal force unit
                    // see http://brm.io/matter-js/docs/files/src_body_Body.js.html line 582
                    // so no conversion necessary

                    body.applyForceFrom(
                        new Phaser.Math.Vector2(s.x, s.y),
                        new Phaser.Math.Vector2(force.x, force.y)
                    );

                    break;
                case GameMode.Velocity:
                    // gonna treat the arrow length as 30 * m / s
                    let velocity = new VectorMeasurement(Vector.div(d, 30), Velocity.MetersPerSecond);

                    // maximum 10 m/s
                    velocity = velocity.times(Math.min(1, 10 / velocity.length()));

                    velocity = velocity.to(Velocity.PixelsPerStep);

                    body.setVelocity(velocity.x, velocity.y);
                    break;
            }
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
                case GameMode.Velocity:
                case GameMode.Mass:
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