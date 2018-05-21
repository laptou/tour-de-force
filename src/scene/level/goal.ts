import { GoalData, ObjectiveData, ObjectiveType, TypeObjectiveData } from "@lib/level";
import { Tile, TileStats } from "@scene/level/tile";
import { find } from "@util/index.ts";
import { dist, Vector, VectorLike } from "@util/math";
import { AngularVelocity, Mass, Measurement, Momentum, Unit, VectorMeasurement, Velocity } from "@util/measurement";

import { Text } from "../../config";


export class Goal extends Phaser.GameObjects.Container {
    public objectives: ObjectiveData[];

    private _completed: boolean = false;

    private background: Phaser.GameObjects.TileSprite;
    private tiles: Tile[] = [];

    constructor(scene: Phaser.Scene, config: GoalData) {
        super(scene);

        this.objectives = config.objectives;

        let { x, y } = Vector.mult({ x: config.x, y: config.y }, 32);
        let { x: width, y: height } = Vector.mult({ x: config.width, y: config.height }, 32);

        this.setPosition(x, y);

        this.background = new Phaser.GameObjects.TileSprite(scene, 0, 0, width, height, "sprites", 13);
        this.background.tint = 0xFFAAAA;

        this.add(this.background);

        const border = scene.make.graphics({}, false)
            .lineStyle(2, 0x000000, 0.5)
            .fillStyle(0x000000, 0.25)
            .strokeRect(-width / 2 + 4, -height / 2 + 4, width - 8, height - 8);

        this.add(border);

        const typeObjective = find(this.objectives, o => o.type === ObjectiveType.Type) as TypeObjectiveData | null;

        if (typeObjective) {
            const tileImage = scene.make.image({
                key: "sprites",
                frame: TileStats[typeObjective.target].frame,
                alpha: 0.5
            });

            this.add(tileImage);
        }

        const lines = [];

        for (const o of this.objectives) {
            let variable = "";
            let unit = Unit.scalar;

            switch (o.type) {
                case ObjectiveType.Type:
                    continue;
                case ObjectiveType.Velocity:
                    variable = "v";
                    unit = Velocity.MetersPerSecond;
                    break;
                case ObjectiveType.Momentum:
                    variable = "ρ"
                    unit = Momentum.KilogramMetersPerSecond;
                    break;
                case ObjectiveType.AngularVelocity:
                    variable = "ω"
                    unit = AngularVelocity.RadiansPerSecond;
                    break;
            }

            if (typeof o.target === "number") // number
                lines.push(`${variable} = ${new Measurement(o.target, unit).toExponential(3)}`);
            else if ("x" in o.target) // vector
                lines.push(`${variable} = ${new VectorMeasurement(o.target, unit).toExponential(1)}`);
            else // min and max
            {
                let line = variable;

                if (typeof o.target.maximum === "number")
                    line = `${line} < ${new Measurement(o.target.maximum, unit).toExponential(3)}`;
                if (typeof o.target.maximum === "object")
                    line = `${line} < ${new VectorMeasurement(o.target.maximum, unit).toExponential(1)}`;

                if (typeof o.target.minimum === "number")
                    line = `${new Measurement(o.target.minimum, unit).toExponential(3)} < ${line}`;
                if (typeof o.target.minimum === "object")
                    line = `${new VectorMeasurement(o.target.minimum, unit).toExponential(1)} < ${line}`;

                lines.push(line);
            }
        }

        const description = scene.make.text({
            style: {
                align: "center",
                ...Text.Header
            },
            alpha: 0.7,
            origin: 0.5,
            text: lines.join("\n")
        });

        this.add(description);

        const body = scene.matter.add.gameObject(this, {
            isStatic: true,
            isSensor: true,
            shape: {
                type: "rectangle",
                width,
                height
            }
        });

        const world = (body as any).world as Phaser.Physics.Matter.World;

        world.on("collisionstart", this.collisionstart, this);
        world.on("collisionactive", this.collisionactive, this);
        world.on("afterupdate", this.afterupdate, this);
        world.on("collisionend", this.collisionend, this);
    }

    public get completed() { return this._completed; }
    public set completed(value) {
        const old = this._completed;

        this._completed = value;
        this.background.tint = value ? 0xAAFFAA : 0xFFAAAA;

        if (old !== value)
            this.emit("update:completed", value);
    }

    public meetsObjectives(tile: Tile) {
        const body = tile.body as Matter.Body;
        const bounds = (this.body as Matter.Body).bounds as { min: VectorLike, max: VectorLike };
        const epsilon = 10; // these are pixels, so ε = 1 is fine
        const within = body.vertices.every(v =>
            v.x <= bounds.max.x + epsilon && bounds.min.x <= v.x + epsilon &&
            v.y <= bounds.max.y + epsilon && bounds.min.y <= v.y + epsilon);

        return within && this.objectives.every(o => {
            let quantity: Vector | number;

            switch (o.type) {
                case ObjectiveType.Type:
                    return o.target === tile.tileType;
                case ObjectiveType.Velocity:
                    quantity =
                        new VectorMeasurement(body.velocity, Velocity.PixelsPerStep)
                            .to(Velocity.MetersPerSecond);
                    break;
                case ObjectiveType.Momentum:
                    quantity =
                        new VectorMeasurement(body.velocity, Velocity.PixelsPerStep)
                            .to(Velocity.MetersPerSecond)
                            .times(new Measurement(body.mass, Mass.Kilogram));
                    break;
                case ObjectiveType.AngularVelocity:
                    quantity =
                        new Measurement(body.angularVelocity, AngularVelocity.DegreesPerStep)
                            .to(AngularVelocity.RadiansPerSecond)
                            .valueOf();
                    break;
                default:
                    return false;
            }

            if (typeof o.target === "number" || "x" in o.target) {
                return dist(quantity, o.target) < 0.05;
            } else {
                // min and max
                if (typeof quantity === "object") {
                    if (typeof o.target.maximum !== "undefined")
                        if (Vector.lt(o.target.maximum, quantity)) return false;

                    if (typeof o.target.minimum !== "undefined")
                        if (Vector.gt(o.target.minimum, quantity)) return false;
                } else {
                    if (typeof o.target.maximum === "number" && o.target.maximum < quantity)
                        return false;

                    if (typeof o.target.maximum === "object" && Vector.len(o.target.maximum) < quantity)
                        return false;

                    if (typeof o.target.minimum === "number" && o.target.minimum > quantity)
                        return false;

                    if (typeof o.target.minimum === "object" && Vector.len(o.target.minimum) > quantity)
                        return false;
                }
            }

            return true;
        });
    }

    private collisionstart(event: Matter.IEventCollision<Phaser.Physics.Matter.World>,
        a: Matter.Body, b: Matter.Body) {

        if (this.completed) return;
        if (a !== this.body && b !== this.body) return;

        let me = a === this.body ? a : b, them = b === this.body ? a : b;

        const tile = (them as any).gameObject;

        if (tile instanceof Tile) {
            if (this.meetsObjectives(tile)) {
                this.completed = true;
            } else {
                this.tiles.push(tile);
            }
        }
    }

    private collisionactive(event: Matter.IEventCollision<Phaser.Physics.Matter.World>,
        a: Matter.Body, b: Matter.Body) {

        if (this.completed) return;
        if (a !== this.body && b !== this.body) return;

        let me = a === this.body ? a : b, them = b === this.body ? a : b;

        const tile = (them as any).gameObject;

        if (tile instanceof Tile) {
            if (this.meetsObjectives(tile)) {
                this.completed = true;
            }
        }
    }

    private collisionend(event: Matter.IEventCollision<Phaser.Physics.Matter.World>,
        a: Matter.Body, b: Matter.Body) {
        if (a !== this.body && b !== this.body) return;

        let me = a === this.body ? a : b, them = b === this.body ? a : b;

        const tile = (them as any).gameObject;

        if (tile instanceof Tile) {
            this.tiles.splice(this.tiles.indexOf(tile), 1);
        }
    }

    private afterupdate() {
        if (!this.tiles.length) {
            this.completed = false;
            return;
        }

        for (const tile of this.tiles) {
            if (this.meetsObjectives(tile)) {
                this.completed = true;
                return;
            }
        }

        this.completed = false;
    }
}