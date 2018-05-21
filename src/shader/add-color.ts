import * as Phaser from "phaser";

export class AddColorPipeline extends Phaser.Renderer.WebGL.Pipelines.TextureTintPipeline
{

    constructor(game: Phaser.Game)
    {
        const fragShader = require("@res/shader/add-color");
        super({
            game,
            renderer: game.renderer,
            fragShader
        });
    }
}