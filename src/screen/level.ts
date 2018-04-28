import { Easing, Tween } from "@tweenjs/tween.js";
import * as PIXI from "pixi.js";

import { App, ResumeParameters } from "..";
import { Grid } from "../control/grid";
import { promise } from "../util";
import { IScreen } from "./base";

const { sin, cos, random, sqrt, PI } = Math;

export class LevelScreen extends PIXI.Container implements IScreen
{

    private app: App | undefined;
    private grid: PIXI.extras.TilingSprite | undefined;

    public outro(): Promise<void>
    {
        throw new Error("Method not implemented.");
    }

    public async init(app: App): Promise<void>
    {
        this.app = app;
        this.interactive = true;

        const bg = new PIXI.Sprite(PIXI.Texture.WHITE);
        bg.width = app.resolution.width;
        bg.height = app.resolution.height;
        this.addChild(bg);

        this.grid = new Grid(app.renderer, app.resolution.width, app.resolution.height);
        this.grid.alpha = 0.5;
        this.addChild(this.grid);

        app.stage.addChild(this);

    }

    public resume(params: ResumeParameters): void
    {
    }

    public async intro(): Promise<void>
    {
        if (!this.app) return;

        const { width, height } = this.app.resolution;

        const mask = new PIXI.Graphics();
        const diag = sqrt(width * width + height * height);
        mask.beginFill(0xFFFFFF, 1);
        mask.drawCircle(width / 2, height / 2, diag);
        mask.endFill();

        mask.position.set(width / 2, height / 2);
        mask.scale.set(0);

        this.mask = mask;

        this.addChild(mask);

        await promise(
            new Tween(mask.scale)
                .delay(500)
                .to({ x: 1, y: 1 }, 500)
                .easing(Easing.Circular.Out)
                .start());
    }

    public pause(): void
    {
    }

    public async destroy(): Promise<void>
    {
        super.destroy({ children: true });
    }

    public update(time: number, delta: number): void
    {
    }
}