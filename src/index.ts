import * as Phaser from "phaser";

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
            backgroundColor: "#000000",
            physics: { default: "matter" },
            scene: [new TitleScene()]
        })
    }
}

window.addEventListener("load", () =>
{
    const game = new TourDeForceGame();
});