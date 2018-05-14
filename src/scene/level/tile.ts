export enum TileType {
    Wood = "wood", Steel = "steel", Aluminum = "aluminum"
}

export interface TileConfig {
    x: number;
    y: number;
    type: TileType;
}

export class Tile extends Phaser.GameObjects.Sprite {

    constructor(scene: Phaser.Scene, config: TileConfig) {
        let frame: number;
        let mass: number;

        switch (config.type) {
            case TileType.Wood:
                frame = 5;
                mass = 75;
                break;
            case TileType.Steel:
                frame = 6;
                mass = 120;
                break;
            case TileType.Aluminum:
                frame = 7;
                mass = 100;
                break;
            default:
                throw new Error("Invalid crate type.");
        }

        super(scene,
            config ? config.x * 32 || 0 : 0,
            config ? config.y * 32 || 0 : 0,
            "sprites", frame);

        const matterObj = scene.matter.add.gameObject(this, {
            chamfer: { radius: 16 },
            mass
        });
        matterObj.type = "tile";
        matterObj.setInteractive();
    }
}