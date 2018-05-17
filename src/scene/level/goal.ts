import { GoalData } from "@lib/level";

export class Goal extends Phaser.GameObjects.Container {
    constructor(scene: Phaser.Scene, config: GoalData) {
        let { width, height } = config.size;
        width *= 32;
        height *= 32;

        const backgroundGraphics = scene.make.graphics({}, false)
            .lineStyle(2, 0x000000, 0.5)
            .fillStyle(0x000000, 0.25)
            .fillRect(0, 0, width, height)
            .strokeRect(0, 0, width, height);

        super(scene);

        const body = scene.matter.add.gameObject(this, {
            add: false,
            isSensor: true,
            shape: {
                type: "rectangle",
                width,
                height
            }
        });

        body.on("collisionstart", () => {
            console.log("goal!");
        });
    }
}