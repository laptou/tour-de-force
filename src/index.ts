import * as Phaser from "phaser";

import { LevelSelectScene } from "./scene/select";
import { TitleScene } from "./scene/title";

const Stats = require("stats.js");
const stats = new Stats();
stats.showPanel(0);

class TourDeForceGame extends Phaser.Game
{
    constructor()
    {
        super({
            height: window.innerHeight,
            width: window.innerWidth,
            type: Phaser.WEBGL,
            backgroundColor: "#FFFFFF",
            physics: { default: "matter" },
            scene: [new TitleScene(), new LevelSelectScene()],
            autoResize: true,
            resolution: Math.floor(window.devicePixelRatio)
        });

        this.events.on("ready", this.onready, this);

        this.scene.start("title");
    }

    public onready()
    {
    }
}

window.addEventListener("load", () =>
{
    const game = new TourDeForceGame();
});