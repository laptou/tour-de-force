import { GoalData, Objective, ObjectiveType } from "@lib/level";
import { Vector } from "@util/math";

export class Goal extends Phaser.GameObjects.Container {
    public objectives: Objective[];

    constructor(scene: Phaser.Scene, config: GoalData) {
        super(scene);

        this.objectives = config.objectives.map(c => new Objective(c));

        let { x, y } = Vector.mult({ x: config.x, y: config.y }, 32);
        let { x: width, y: height } = Vector.mult({ x: config.width, y: config.height }, 32);

        this.setPosition(x, y);

        const background = new Phaser.GameObjects.TileSprite(
            scene,
            0, 0,
            width, height,
            "controls", 12);

        this.add(background);

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

        world.on("collisionactive", this.collisionactive, this);
    }

    public meetsObjectives(body: Matter.Body) {
        return this.objectives.every(o => {
            const bounds = this.getBounds();

            switch (o.type) {
                case ObjectiveType.Position:
                    return body.vertices.every(v => bounds.contains(v.x, v.y));
                default:
                    return false;
            }
        });
    }

    private collisionactive(event: Matter.IEventCollision<Phaser.Physics.Matter.World>,
        a: Matter.Body, b: Matter.Body) {

        if (a !== this.body && b !== this.body) return;

        let me = a === this.body ? a : b, them = b === this.body ? a : b;

        if (this.meetsObjectives(them)) {
            this.scene.matter.world.off("collisionactive", this.collisionactive, this, false);
        }
    }
}