import { GoalData } from "@lib/level";
import { Vector } from "@util/math";

export class Goal extends Phaser.GameObjects.Container {
    constructor(scene: Phaser.Scene, config: GoalData) {
        super(scene);

        let { x, y } = Vector.mult({ x: config.x, y: config.y }, 32);
        let { x: width, y: height } = Vector.mult({ x: config.width, y: config.height }, 32);

        this.setPosition(x, y);

        const backgroundGraphics = scene.make.graphics({}, false)
            .lineStyle(2, 0x000000, 0.5)
            .fillStyle(0x000000, 0.25)
            .fillRect(-width / 2, -height / 2, width, height)
            .strokeRect(-width / 2, -height / 2, width, height);

        this.add(backgroundGraphics);

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
        world.on("collisionstart", (event: any, a: Matter.Body, b: Matter.Body) => {
            if (a !== this.body && b !== this.body) return;

            let me = a === this.body ? a : b, them = b === this.body ? a : b;

            console.log("coal!");
        });


        body.on("collisionstart", () => {
            console.log("goal!");
        });
    }
}