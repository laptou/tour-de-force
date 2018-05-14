import * as Phaser from "phaser";

export class GreyscalePipeline extends Phaser.Renderer.WebGL.Pipelines.TextureTintPipeline {

    constructor(game: Phaser.Game) {
        const fragShader = require("@res/shader/grey");
        super({
            game,
            renderer: game.renderer,
            fragShader
        });
    }
}