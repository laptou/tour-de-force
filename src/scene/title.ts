import * as Phaser from "phaser";

export class TitleScene extends Phaser.Scene
{
    private grid: Phaser.GameObjects.TileSprite | undefined;

    constructor()
    {
        super({ key: "title" });
    }

    public preload() 
    {
        console.log("preload() called");

        const graphics = this.make.graphics();

        graphics
            .lineStyle(5, 0xFFFFFF, 1)
            .lineBetween(0, 0, 0, 80)
            .lineBetween(0, 0, 80, 0);

        graphics.generateTexture("tile", 80, 80);

        graphics.destroy();

        const { width, height } = this.cameras.main;
        this.grid = this.add.tileSprite(width / 2, height / 2, width, height, "tile");

        console.log("preload() finished");
    }

    public create()
    {
        console.log("create() called");

    }

    public update(total: number, delta: number)
    {
        if (this.grid)
        {
            this.grid.tilePositionX += 0.05 * delta;
            this.grid.tilePositionY += 0.05 * delta;
        }
    }
}