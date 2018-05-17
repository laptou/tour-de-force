import { TileType } from "@scene/level/tile";

export enum ObjectiveType {
    Position,
    Velocity,
    Speed,
    Momentum,
    AngularVelocity
}

export interface ObjectiveConfig {
    target: { minimum: number; maximum: number } | number;
    type: ObjectiveType;
    allowedTiles: TileType[];
}

export class Objective {
    public minimum: number;
    public maximum: number;
    public type: ObjectiveType;
    public allowedTiles: TileType[];


    public constructor(config: ObjectiveConfig) {
        if (typeof config.target === "object") {
            const { minimum, maximum } = config.target;
            [this.minimum, this.maximum] = [minimum, maximum];
        }
        else {
            this.minimum = this.maximum = config.target;
        }

        this.type = config.type;
        this.allowedTiles = config.allowedTiles;
    }
}

export enum GoalType {
    Required,
    Bonus
}

export interface GoalConfig {
    objectives: Objective[];
    size: { width: number; height: number };
    type?: GoalType;
}

export class Goal extends Phaser.GameObjects.Container {
    constructor(scene: Phaser.Scene, config: GoalConfig) {
        config = { type: GoalType.Required, ...config };

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