import { GameMode, LevelData } from "@lib/level";
import { LevelScene } from "@scene/level";
import { Tile } from "@scene/level/tile";
import { ControlAlignment, HudButton, ModeHudButtonConfig } from "@scene/util/ui";
import { fixed, precision } from "@util/format";
import { clamp, Ray, Vector } from "@util/math";
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

import { Text } from "../../config";

export class LevelHud extends Phaser.GameObjects.Container {
    private actionInfo!: Phaser.GameObjects.Text;
    private targetInfo!: Phaser.GameObjects.Text;

    private dirty = false;
    private labels!: { ray?: { x: Phaser.GameObjects.Text; y: Phaser.GameObjects.Text; } };
    private frame!: Phaser.GameObjects.Graphics;
    private overlays!: Phaser.GameObjects.Graphics;

    private ray?: Ray;

    constructor(scene: LevelScene) {
        super(scene);

        const cam = scene.cameras.main;
        const { height, width } = cam;

        this.frame = scene.make.graphics({})
            .fillStyle(0xFFFFFF)
            .fillRect(0, 0, 50, height)
            .fillRect(width - 50, 0, 50, height)
            .fillRect(50, 0, width - 100, 50)
            .fillRect(50, height - 50, width - 100, 50)
            .lineStyle(4, 0x000000)
            .strokeRect(48, 48, width - 96, height - 96);
        this.add(this.frame);

        this.overlays = scene.make.graphics({});
        this.add(this.overlays);

        this.labels = {};

        // current level
        this.add(scene.make.text({
            x: 50,
            y: height - 40,
            text: `Level ${(this.scene.level as LevelData).index + 1}`,
            style: Text.Header
        }));

        // information
        this.add(this.actionInfo = scene.make.text({
            x: width / 2,
            y: height - 20,
            text: "",
            origin: 0.5,
            style: Text.Normal.Light
        }));

        this.add(this.targetInfo = scene.make.text({
            x: width - 50,
            y: 100,
            text: "",
            origin: { x: 1, y: 0 },
            backgroundColor: "white",
            padding: 10,
            style: Text.Normal.Light
        }));

        // mode buttons
        this.add(this.makeModeHudButton({
            sprite: "controls",
            frame: 1,
            offset: { x: 100, y: 40 },
            text: "F",
            tooltip: "Force Mode",
            mode: GameMode.Force
        }).setName(GameMode.Force));

        this.add(this.makeModeHudButton({
            sprite: "controls",
            frame: 5,
            offset: { x: 150, y: 40 },
            text: "V",
            tooltip: "Velocity Mode",
            mode: GameMode.Velocity
        }).setName(GameMode.Velocity));

        this.add(this.makeModeHudButton({
            sprite: "controls",
            frame: 3,
            offset: { x: 200, y: 40 },
            text: "M",
            tooltip: "Mass Mode",
            mode: GameMode.Mass
        }).setName(GameMode.Mass));

        // events 
        scene.input.on("pointermove", this.onPointerMove, this);
        scene.input.on("pointerup", this.onPointerUp, this);
        scene.events.on("tiledown", this.onTileDown, this);
    }

    public get scene(): LevelScene {
        return super.scene as LevelScene;
    }

    public update() {
        super.update();

        const cam = this.scene.cameras.main;
        const { height, width } = cam;
        const gameWidth = (this.scene.level as LevelData).size * 32;

        const target = this.scene.state.target;

        // update camera
        if (this.scene.state.track) {
            cam.scrollX = this.scene.state.track.x - width / 2;
        }

        const clampedX = clamp(-50, cam.scrollX, gameWidth + 50 - width);

        this.setPosition(clampedX, cam.scrollY);

        if (target) {
            const body = target.body as Matter.Body;

            this.targetInfo.setBackgroundColor("#FFFFFF");

            const m = new Measurement(body.mass, Mass.Kilogram);

            const x = new VectorMeasurement(target, Distance.Pixel).to(Distance.Meter);

            const v = new VectorMeasurement(body.velocity, Velocity.PixelsPerStep).to(Velocity.MetersPerSecond);

            const theta = new Measurement(target.angle, Angle.Degree).to(Angle.Radian);

            const omega = new Measurement(body.angularVelocity, AngularVelocity.DegreesPerStep).to(AngularVelocity.RadiansPerSecond);

            this.targetInfo.setText([
                fixed(1) `m: ${m}`,
                fixed(1) `x: ${x}`,
                fixed(1) `v: ${v}`,
                fixed(1) `θ: ${theta}`,
                fixed(1) `ω: ${omega}`,
            ]);
        }

        if (!this.dirty)
            return;

        if (this.ray && this.labels.ray) {
            const { source, direction: mag } = this.ray;
            const offset = Vector.div(mag, 2);

            this.labels.ray.x.setPosition(clampedX + source.x + offset.x, source.y);
            this.labels.ray.y.setPosition(clampedX + source.x + mag.x, source.y + offset.y);
        }

        // update overlays if necessary
        if (this.overlays) {
            this.overlays.clear();

            this.actionInfo.text = "";

            if (this.scene.state.target && this.ray) {
                let color;
                let info;
                const body = this.scene.state.target.body as Matter.Body;

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
    }

    private get mode() {
        return this.scene.state.mode;
    }

    private createRay(x: number, y: number) {
        this.ray = new Ray({ x, y }, { x: 0, y: 0 });

        const label = {
            x, y,
            style: { fontWeight: "bold", ...Text.Normal.Dark },
            backgroundColor: "black",
            origin: 0.5,
            padding: 5,
            alpha: 0
        };

        this.labels.ray = {
            x: this.scene.make.text(label).setOrigin(0.5) as Phaser.GameObjects.Text,
            y: this.scene.make.text(label).setOrigin(0.5) as Phaser.GameObjects.Text
        }

        this.add(this.labels.ray.x);
        this.add(this.labels.ray.y);

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
                const camera = this.scene.cameras.main;

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
        if (this.ray && this.scene.state.target) {
            const body = this.scene.state.target as any as Phaser.Physics.Matter.Components.Force & Phaser.Physics.Matter.Components.Velocity;

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

    private onTileDown(pointer: Phaser.Input.Pointer, tile: Tile) {
        switch (this.scene.state.mode) {
            case GameMode.Force:
            case GameMode.Velocity:
            case GameMode.Mass:
                this.scene.state.target = tile;
                this.createRay(pointer.x, pointer.y);
                break;
        }
    }

    private makeModeHudButton(config: ModeHudButtonConfig) {
        const c = {
            align: ControlAlignment.Right | ControlAlignment.Bottom,
            grey: true,
            ...config
        };

        const btn = new HudButton(this.scene, c);

        if (c.grey) {
            if (this.scene.state.mode !== c.mode)
                btn.sprite.setPipeline("greyscale");

            btn.on("pointerover", () => {
                btn.sprite.resetPipeline();
            });

            btn.on("pointerdown", () => {
                this.scene.state.mode = c.mode;
            });

            btn.on("pointerout", () => {
                if (c.mode !== this.scene.state.mode)
                    btn.sprite.setPipeline("greyscale");
            });

            this.scene.state.on("update:mode", () => {
                if (c.mode !== this.scene.state.mode) btn.sprite.setPipeline("greyscale");
                else btn.sprite.resetPipeline();
            });
        }

        return btn;
    }
}