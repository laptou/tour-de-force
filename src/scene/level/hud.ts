import { GameMode, LevelData } from "@lib/level";
import { LevelScene } from "@scene/level";
import { ForceLevelHudSelector, LevelHudSelector, VelocityLevelHudSelector } from "@scene/level/selector";
import { Tile } from "@scene/level/tile";
import { ControlAlignment, HudButton, ModeHudButtonConfig } from "@scene/util/ui";
import { clamp, Vector } from "@util/math";
import {
    Angle,
    AngularVelocity,
    Distance,
    fixed,
    Mass,
    Measurement,
    Numeric,
    VectorMeasurement,
    Velocity,
} from "@util/measurement";

import { Text } from "../../config";

const { min, max } = Math;

const modeBtns = {
    [GameMode.Force]: {
        frame: 1,
        text: "F",
        tooltip: "Force Mode"
    },
    [GameMode.Velocity]: {
        frame: 5,
        text: "V",
        tooltip: "Velocity Mode"
    },
    [GameMode.Position]: {
        frame: 4,
        text: "X",
        tooltip: "Position Mode"
    }
};

export class LevelHud extends Phaser.GameObjects.Container {
    public scene: LevelScene;

    private actionInfo!: Phaser.GameObjects.Text;
    private targetInfo!: Phaser.GameObjects.Text;

    private dirty = false;
    private frame!: Phaser.GameObjects.Graphics;
    private overlays!: Phaser.GameObjects.Graphics;

    private selector?: LevelHudSelector<Numeric>;

    constructor(scene: LevelScene) {
        super(scene);

        this.scene = scene;

        const cam = scene.cameras.main;
        const { height: py, width: px } = scene.padding;

        const height = Math.min(scene.bounds.height, cam.height - py * 2);
        const width = Math.min(scene.bounds.width, cam.width - px * 2);

        this.frame = scene.make.graphics({})
            .fillStyle(0xFFFFFF)
            .fillRect(0, 0, px, height + py * 2)
            .fillRect(width + px, 0, px, height + py * 2)
            .fillRect(0, 0, width + px * 2, py)
            .fillRect(0, height + py, width + px * 2, py)
            .lineStyle(4, 0x000000)
            .strokeRect(px, py, width, height);
        this.add(this.frame);

        this.overlays = scene.make.graphics({});
        this.add(this.overlays);

        // current level
        this.add(scene.make.text({
            x: px,
            y: py + height + 10,
            text: `Level ${(scene.state.level as LevelData).index + 1}`,
            style: Text.Header
        }));

        // information
        this.add(this.actionInfo = scene.make.text({
            x: px + width / 2,
            y: py + height + 30,
            text: "",
            origin: 0.5,
            style: Text.Normal.Light
        }));

        this.add(this.targetInfo = scene.make.text({
            x: px + width,
            y: py,
            text: "",
            origin: { x: 1, y: 0 },
            backgroundColor: "white",
            padding: 10,
            style: Text.Normal.Light
        }));

        if (scene.state.modes) {
            // mode buttons
            let x = scene.padding.width + 24;
            for (const mode in scene.state.modes) {
                if (!scene.state.modes.hasOwnProperty(mode)) continue;

                const btn = this.makeModeHudButton(scene, {
                    sprite: "controls",
                    offset: { x, y: py - 32 },
                    mode,
                    ...modeBtns[mode]
                });

                this.add(btn);

                x += 48;
            }
        }

        // events 
        scene.input.on("pointermove", this.onpointermove, this);
        scene.input.on("pointerup", this.onpointerup, this);
        scene.events.on("tiledown", this.ontiledown, this);
    }

    public destroy() {
        if (this.scene) {
            this.scene.input.off("pointermove", this.onpointermove, this, false);
            this.scene.input.off("pointerup", this.onpointerup, this, false);
            this.scene.events.off("tiledown", this.ontiledown, this, false);
        }

        super.destroy();
    }

    public update() {
        const cam = this.scene.cameras.main;
        const level = this.scene.state.level as LevelData;
        const target = this.scene.state.target;

        const width = min(cam.width - this.scene.padding.width * 2, this.scene.bounds.width);
        const height = min(cam.height - this.scene.padding.height * 2, this.scene.bounds.height);

        const clampedX = clamp(0, cam.scrollX, this.scene.bounds.width - width);
        const clampedY = clamp(0, cam.scrollY, this.scene.bounds.height - height);

        this.setPosition(clampedX, 0);

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


        // update overlays if necessary
        if (this.overlays) {
            this.overlays.clear();

            this.actionInfo.text = "";

            if (this.scene.state.target && this.selector) {
                const { ray, info, color } = this.selector;

                this.overlays.lineStyle(4, color);

                this.overlays.lineBetween(ray.x1, ray.y1, ray.x2, ray.y2);

                this.overlays.lineStyle(3, color, 0.6);

                this.overlays.lineBetween(ray.x1, ray.y1, ray.x2, ray.y1);
                this.overlays.lineBetween(ray.x2, ray.y1, ray.x2, ray.y2);

                const point = ray.plus(10).end;
                const dir = ray.unit.times(10).direction;
                const p1 = Vector.add(ray.end, { x: dir.y, y: -dir.x });
                const p2 = Vector.add(ray.end, { x: -dir.y, y: dir.x });

                this.overlays.fillStyle(color, 1);
                this.overlays.fillTriangle(point.x, point.y, p2.x, p2.y, p1.x, p1.y);

                this.actionInfo.text = info || "";
            }

            this.actionInfo.updateText();

            this.dirty = false;
        }
    }

    private get state() { return this.scene.state; }
    private get mode() { return this.state.mode; }

    private onpointerup(pointer: Phaser.Input.Pointer, x: number, y: number) {
        if (this.selector) {
            this.selector.activate();
            this.remove(this.selector as any as Phaser.GameObjects.GameObject, true);
        }
    }

    private onpointermove(pointer: Phaser.Input.Pointer) {
        if (this.selector) {
            this.selector.move(pointer.x, pointer.y);
        }
    }

    private ontiledown(pointer: Phaser.Input.Pointer, tile: Tile) {
        this.scene.state.target = tile;

        if (this.state.modes && this.state.modes[this.mode] <= 0) return;
        if (this.state.completed) return;

        switch (this.scene.state.mode) {
            case GameMode.Force:
                this.selector = new ForceLevelHudSelector(this.scene, pointer);
                break;
            case GameMode.Velocity:
                this.selector = new VelocityLevelHudSelector(this.scene, pointer);
                break;
            case GameMode.Position:
                break;
        }
    }

    private makeModeHudButton(scene: LevelScene, config: ModeHudButtonConfig) {
        const c = {
            align: ControlAlignment.Right | ControlAlignment.Bottom,
            grey: true,
            ...config
        };

        const btn = new HudButton(scene, c);

        // tslint:disable-next-line:prefer-template
        btn.setName("mode:" + config.mode);

        btn.on("pointerdown", () => {
            this.scene.state.mode = c.mode;
        });

        if (c.grey) {
            if (scene.state.mode !== c.mode)
                btn.sprite.setPipeline("greyscale");

            btn.on("pointerover", () => {
                btn.sprite.resetPipeline();
            });

            btn.on("pointerout", () => {
                if (c.mode !== this.scene.state.mode)
                    btn.sprite.setPipeline("greyscale");
            });

            scene.state.on("update:mode", () => {
                if (c.mode !== this.scene.state.mode) {
                    btn.sprite.setPipeline("greyscale");
                    btn.setText(modeBtns[c.mode].text);
                } else {
                    if (this.scene.state.modes) {
                        btn.setText(this.scene.state.modes[c.mode].toString());
                        btn.sprite.resetPipeline();
                    }
                }
            });
        }

        return btn;
    }
}