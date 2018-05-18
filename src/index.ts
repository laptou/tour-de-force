import { LevelScene } from "@scene/level";
import { LevelSelectScene } from "@scene/select";
import { TitleScene } from "@scene/title";
import { GreyscalePipeline } from "@shader/greyscale";
import * as Phaser from "phaser";

class TourDeForceGame extends Phaser.Game {
    constructor() {
        super({
            height: window.innerHeight,
            width: window.innerWidth,
            type: Phaser.WEBGL,
            backgroundColor: "#FFFFFF",
            physics: { default: "matter", matter: { gravity: { y: 0.981 } }, debug: true },
            scene: [
                TitleScene,
                LevelSelectScene,
                LevelScene
            ],
            // resolution: window.devicePixelRatio,
        });

        const renderer = this.renderer as Phaser.Renderer.WebGL.WebGLRenderer;
        renderer.addPipeline("greyscale", new GreyscalePipeline(this));

        this.events.on("ready", this.onready, this);
    }

    public onready() {



        console.log("eggu");
        // this.scene.start("level", { level: 0 });
    }
}

window.addEventListener("load", () => {
    let game = new TourDeForceGame();
});