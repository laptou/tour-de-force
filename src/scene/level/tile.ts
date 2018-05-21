import { TileData, TileType } from "@lib/level";

export const TileStats = {
    [TileType.Wood]: {
        frame: 5,
        mass: 75,
    },
    [TileType.Steel]: {
        frame: 6,
        mass: 120
    },
    [TileType.Aluminum]: {
        frame: 7,
        mass: 100
    }
};

export class Tile extends Phaser.GameObjects.Sprite {

    public tileType: TileType;
    public allowControl: boolean;

    constructor(scene: Phaser.Scene, config: TileData) {
        const { frame, mass } = TileStats[config.type];

        super(scene,
            config ? config.x * 32 || 0 : 0,
            config ? config.y * 32 || 0 : 0,
            "sprites", frame);

        const matterObj = scene.matter.add.gameObject(this, {
            chamfer: { radius: 16 },
            mass,
            inertia: !config.rotation ? Infinity : undefined,
            friction: config.friction || 0,
            frictionAir: 0, // no friction; these are physics problems
            frictionStatic: 0,
            restitution: config.elastic ? 1 : 0
        });

        matterObj.type = "tile";
        matterObj.setInteractive();

        this.tileType = config.type;
        this.allowControl = typeof config.control === "boolean" ? config.control : false;
    }
}