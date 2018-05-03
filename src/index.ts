import * as Phaser from "phaser";

import { LevelScene } from "./scene/level";

const Stats = require("stats.js");
const stats = new Stats();
stats.showPanel(0);

class TourDeForceGame extends Phaser.Game {
    constructor() {
        super({
            height: window.innerHeight,
            width: window.innerWidth,
            type: Phaser.WEBGL,
            backgroundColor: "#FFFFFF",
            physics: { default: "matter", matter: { gravity: { y: 0.981 } }, debug: true },
            scene: [/*TitleScene, LevelSelectScene,*/ LevelScene],
            autoResize: true,
            resolution: Math.floor(window.devicePixelRatio)
        });

        this.events.on("ready", this.onready, this);
    }

    public onready() {
        this.scene.start("level", { level: 0 });
    }
}

window.addEventListener("load", () => {
    const game = new TourDeForceGame();
});