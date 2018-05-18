import { GoalData, Objective, ObjectiveType } from "@lib/level";
import { Tile } from "@scene/level/tile";
import { Vector, VectorLike } from "@util/math";

export class Goal extends Phaser.GameObjects.Container {
    public objectives: Objective[];

    private _completed: boolean = false;

    private background: Phaser.GameObjects.TileSprite;
    private tiles: Tile[] = [];

    constructor(scene: Phaser.Scene, config: GoalData) {
        super(scene);

        this.objectives = config.objectives.map(c => new Objective(c));

        let { x, y } = Vector.mult({ x: config.x, y: config.y }, 32);
        let { x: width, y: height } = Vector.mult({ x: config.width, y: config.height }, 32);

        this.setPosition(x, y);

        this.background = new Phaser.GameObjects.TileSprite(
            scene,
            0, 0,
            width, height,
            "sprites", 13);

        this.background.tint = 0xFFAAAA;

        this.add(this.background);

        const border = scene.make.graphics({}, false)
            .lineStyle(2, 0x000000, 0.5)
            .fillStyle(0x000000, 0.25)
            .strokeRect(-width / 2 + 4, -height / 2 + 4, width - 8, height - 8);

        this.add(border);

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
        this._completed = value;
        this.background.tint = value ? 0xAAFFAA : 0xFFAAAA;
        this.emit("update:completed");
    }

    public meetsObjectives(body: Matter.Body) {
        return this.objectives.every(o => {
            const bounds = (this.body as Matter.Body).bounds as { min: VectorLike, max: VectorLike };
            const epsilon = 1; // these are pixels, so ε = 1 is fine

            switch (o.type) {
                case ObjectiveType.Position:
                    return body.vertices.every(v =>
                        v.x <= bounds.max.x + epsilon && bounds.min.x <= v.x + epsilon &&
                        v.y <= bounds.max.y + epsilon && bounds.min.y <= v.y + epsilon);
                default:
                    return false;
            }
        });
    }

    private collisionstart(event: Matter.IEventCollision<Phaser.Physics.Matter.World>,
        a: Matter.Body, b: Matter.Body) {

        if (this.completed) return;
        if (a !== this.body && b !== this.body) return;

        let me = a === this.body ? a : b, them = b === this.body ? a : b;

        if (this.meetsObjectives(them)) {
            this.completed = true;
        } else {
            const tile = (b as any).gameObject as Tile;

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
        if (this.completed) return;
        if (!this.tiles.length) return;

        for (const tile of this.tiles) {
            if (this.meetsObjectives(tile.body as Matter.Body)) {
                this.completed = true;
                this.tiles = [];
                break;
            }
        }
    }
}