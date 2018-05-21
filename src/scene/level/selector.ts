import { GameMode } from "@lib/level";
import { LevelScene } from "@scene/level";
import { Ray, Vector, VectorLike } from "@util/math";
import { Force, Mass, Measurement, Numeric, precision, Time, Unit, VectorMeasurement, Velocity } from "@util/measurement";

import { Text } from "../../config";

export interface LevelHudSelector<T extends Numeric> {
    info: string;
    color: number;
    start: number | Vector;
    end: number | Vector;
    show: boolean;

    move(x: number, y: number): void;
    query(): T;
    activate(): void;
}

export interface VectorLevelSelectorConfig {
    mode: GameMode;
    unit: Unit;
    scale?: number;
    x: number;
    y: number;
    show: boolean;
}

export abstract class VectorLevelHudSelector
    extends Phaser.GameObjects.Container
    implements LevelHudSelector<VectorMeasurement>
{
    public abstract get info(): string;
    public abstract get color(): number;

    public ray: Ray;
    public scene: LevelScene;

    public mode: GameMode;
    public unit: Unit;
    public show: boolean;
    public scale: number = 1;

    private dirty = false;
    private labelX?: Phaser.GameObjects.Text;
    private labelY?: Phaser.GameObjects.Text;

    constructor(scene: LevelScene, config: VectorLevelSelectorConfig) {
        super(scene);

        this.scene = scene;

        this.mode = config.mode;
        this.unit = config.unit;
        this.show = config.show;
        this.ray = new Ray({ x: config.x, y: config.y }, Vector.zero);

        if (typeof config.scale === "number") this.scale = config.scale;


        const label = {
            x: config.x,
            y: config.y,
            style: {
                fontWeight: "bold",
                backgroundColor: "#111111",
                ...Text.Normal.Dark,
            },
            origin: 0.5,
            padding: 5,
            alpha: 0
        };

        this.labelX = this.scene.make.text(label).setOrigin(0.5) as Phaser.GameObjects.Text;
        this.labelY = this.scene.make.text(label).setOrigin(0.5) as Phaser.GameObjects.Text;

        this.add(this.labelX);
        this.add(this.labelY);

        this.scene.matter.world.pause();
    }

    protected get state() {
        return this.scene.state;
    }

    public query(): VectorMeasurement {
        if (!this.ray)
            return VectorMeasurement.zero;

        return new VectorMeasurement(Vector.mult(this.ray.direction, this.scale), this.unit);
    }

    public move(x: number, y: number) {
        if (this.ray) {
            let d = Vector.sub({ x, y }, this.ray.source);
            let dlen = d.length();
            d = d.times(Math.min(1, 300 / dlen));

            this.ray.direction = d;

            const offset = Vector.div(d, 2);
            const source = this.ray.source;
            const alpha = Math.min(1, dlen / 50);

            const vec = this.query();

            if (this.labelX) {
                this.labelX.setText(new Measurement(vec.x, vec.unit).toPrecision(3));
                this.labelX.setPosition(source.x + offset.x, source.y);
                this.labelX.setAlpha(alpha);
            }

            if (this.labelY) {
                this.labelY.setText(new Measurement(vec.y, vec.unit).toPrecision(3));
                this.labelY.setPosition(source.x + d.x, source.y + offset.y);
                this.labelY.setAlpha(alpha);
            }
        }
    }

    public abstract activate(): void;

    public get start() { return new Vector(this.ray.source); }
    public get end() { return this.ray.end; }
}

export class ForceLevelHudSelector extends VectorLevelHudSelector {
    public constructor(scene: LevelScene, origin: VectorLike) {
        super(scene, {
            mode: GameMode.Force,
            unit: new Unit(Force.Newton),
            scale: 100,
            x: origin.x,
            y: origin.y,
            show: true
        });
    }

    public get color() { return 0x800000; }

    public get info() {
        if (!this.state.target) return "";

        const body = this.state.target.body as any;
        const time = new Measurement(1 / 60, Time.Second);
        const mass = new Measurement(body.mass, Mass.Kilogram);
        const force = this.query().magnitude();

        const accel = force.over(mass);
        const velo = accel.times(time);

        const acceleration = precision(3) `F (${force}) / m (${mass}) = a (${accel})`;
        const velocity = precision(3) `a (${accel}) × Δt (1/60 s) = Δv (${velo})`;

        return [acceleration, velocity].join("\n");
    }

    public activate(): void {
        if (!this.ray) return;

        this.scene.matter.world.resume();

        if (this.state.modes) {
            this.state.modes[this.mode]--;
        }

        if (this.ray && this.state.target) {
            const body = this.state.target.body as any;

            const s = this.ray.source;
            const d = this.ray.direction;

            // gonna treat the arrow length as 100 * matter-newton   
            let force = new VectorMeasurement(Vector.div(d, 100), Force.PixelNewton);

            // maximum 3 matter-newton = 300 N
            force = force.times(Math.min(1, 3 / force.length()));

            // kg * px / s^2 is matterjs's internal force unit
            // see http://brm.io/matter-js/docs/files/src_body_Body.js.html line 582
            // so no conversion necessary

            (this.state.target as any).applyForceFrom(
                new Phaser.Math.Vector2(s.x, s.y),
                new Phaser.Math.Vector2(force.x, force.y));
        }
    }
}

export class VelocityLevelHudSelector extends VectorLevelHudSelector {
    public constructor(scene: LevelScene, origin: VectorLike) {
        super(scene, {
            mode: GameMode.Velocity,
            unit: Velocity.MetersPerSecond,
            scale: 1 / 30,
            x: origin.x,
            y: origin.y,
            show: true
        });
    }

    public get color() { return 0x006ad1; }

    public get info() {
        if (!this.state.target) return "";

        const body = this.state.target.body as any;
        const mass = new Measurement(body.mass, Mass.Kilogram);
        const velo = this.query().magnitude();

        const momentum = precision(3) `m (${mass}) * v (${velo}) = ρ (${velo.times(mass)})`;

        return momentum;
    }

    public activate(): void {
        if (!this.ray) return;

        this.scene.matter.world.resume();

        if (this.state.modes) {
            this.state.modes[this.mode]--;
        }

        if (this.ray && this.state.target) {
            const body = this.state.target as any;

            const s = this.ray.source;
            const d = this.ray.direction;

            // gonna treat the arrow length as 30 * m / s
            let velocity = new VectorMeasurement(Vector.div(d, 30), Velocity.MetersPerSecond);

            // maximum 10 m/s
            velocity = velocity.times(Math.min(1, 10 / velocity.length()));

            velocity = velocity.to(Velocity.PixelsPerStep);

            (this.state.target as any).setVelocity(velocity.x, velocity.y);
        }
    }
}
