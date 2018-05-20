import { GoalData, ObjectiveData, ObjectiveType, TypeObjectiveData } from "@lib/level";
import { Tile, TileStats } from "@scene/level/tile";
import { find } from "@util/index.ts";
import { Vector, VectorLike } from "@util/math";
import { Measurement, Momentum, Unit, VectorMeasurement, Velocity } from "@util/measurement";

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
            }

            if (typeof o.target === "number") // number
                lines.push(`${variable} = ${new Measurement(o.target, unit)}`);
            else if ("x" in o.target) // vector
                lines.push(`${variable} = ${new VectorMeasurement(o.target, unit)}`);
            else // min and max
            {
                let line = variable;

                if (typeof o.target.maximum === "number")
                    line = `${line} < ${new Measurement(o.target.maximum, unit)}`;
                if (typeof o.target.maximum === "object")
                    line = `${line} < ${new VectorMeasurement(o.target.maximum, unit)}`;

                if (typeof o.target.minimum === "number")
                    line = `${new Measurement(o.target.minimum, unit)} < ${line}`;
                if (typeof o.target.minimum === "object")
                    line = `${new VectorMeasurement(o.target.minimum, unit)} < ${line}`;

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
        return this.objectives.every(o => {
            const body = tile.body as Matter.Body;
            const bounds = (this.body as Matter.Body).bounds as { min: VectorLike, max: VectorLike };
            const epsilon = 1; // these are pixels, so ε = 1 is fine
            const within = body.vertices.every(v =>
                v.x <= bounds.max.x + epsilon && bounds.min.x <= v.x + epsilon &&
                v.y <= bounds.max.y + epsilon && bounds.min.y <= v.y + epsilon);

            if (!within)
                return false;

            if (o.type === ObjectiveType.Type && o.target !== tile.tileType)
                return false;

            let quantity: Vector | null = null;

            switch (o.type) {
                case ObjectiveType.Velocity:
                    quantity =
                        new VectorMeasurement(body.velocity, Velocity.PixelsPerStep)
                            .to(Velocity.MetersPerSecond);
                    break;
            }

            if (quantity && typeof o.target !== "string") {
                if (typeof o.target === "number") // number
                    return Math.abs(quantity.length() - o.target) < 0.05;
                else if ("x" in o.target) // vector
                    return quantity.minus(o.target).length() < 0.05;
                else // min and max
                {
                    if (typeof o.target.maximum !== "undefined")
                        if (Vector.lt(o.target.maximum, quantity)) return false;

                    if (typeof o.target.minimum !== "undefined")
                        if (Vector.gt(o.target.minimum, quantity)) return false;

                    return true;
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

        const tile = (them as any).gameObject as Tile;

        if (this.meetsObjectives(tile)) {
            this.completed = true;
        } else {
            this.tiles.push(tile);
        }
    }

    private collisionend(event: Matter.IEventCollision<Phaser.Physics.Matter.World>,
        a: Matter.Body, b: Matter.Body) {
        if (a !== this.body && b !== this.body) return;

        let me = a === this.body ? a : b, them = b === this.body ? a : b;

        const tile = (b as any).gameObject as Tile;

        this.tiles.splice(this.tiles.indexOf(tile), 1);
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