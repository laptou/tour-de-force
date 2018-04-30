import * as Phaser from "phaser";

export class TitleScene extends Phaser.Scene
{
    constructor()
    {
        super({});

    }

    public preload() 
    {
        console.log("preload() called");

        const graphics = this.add.graphics();

        graphics
            .lineStyle(10, 0xFF0000, 0.8)
            .moveTo(0, 0)
            .lineTo(0, 80)
            .moveTo(0, 0)
            .lineTo(80, 0);

        graphics.generateTexture("tile");

        this.add.tileSprite(0, 0, 800, 800, "tile");

        graphics.destroy();
    }

    public create()
    {
        console.log("create() called");

    }
}