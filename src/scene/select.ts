import * as Phaser from "phaser";

const { sin, cos, random, PI } = Math;

export class LevelSelectScene extends Phaser.Scene
{
    private titleText: Phaser.GameObjects.Text | undefined;
    private grid: Phaser.GameObjects.TileSprite | undefined;
    private speed: number = 0.05;

    constructor()
    {
        super({ key: "level-select" });
    }


    public preload() 
    {
        this.events.on("transitioncomplete", this.transitioncomplete, this);

    }

    public create()
    {
        const { width, height } = this.cameras.main;
        this.grid = this.add.tileSprite(width / 2, height / 2, width, height, "tile");

        this.titleText =
            this.add.text(20, -50, "Choose a level")
                .setFontFamily("Montserrat Black")
                .setFontSize(32)
                .setFill("#EE0000")
                .setStroke("#FFFFFF", 10)
                .setShadow(0, 0, "#AAAAAA", 6, true, false);
    }

    public update(total: number, delta: number)
    {
        if (this.grid)
        {
            this.grid.tilePositionX = this.speed * total;
            this.grid.tilePositionY = this.speed * total;
        }
    }

    public transitioncomplete() 
    {
        this.tweens.add({
            targets: this.titleText,
            y: 20,
            duration: 1500,
            ease: 'Elastic',
            easeParams: [1.1, 0.5]
        });
    }
}