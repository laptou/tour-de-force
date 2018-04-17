import { Tween } from "@tweenjs/tween.js";
import * as PIXI from "pixi.js";

import { App, ResumeParameters } from "..";
import { IScreen } from "./base";

const { sin, cos, random, PI } = Math;

export class TitleScreen extends PIXI.Container implements IScreen
{
    private grid: PIXI.extras.TilingSprite | undefined;
    private logo: PIXI.Sprite | undefined;
    private app: App | undefined;

    public resume(params: ResumeParameters): void
    {
        console.log("resume() called");
    }

    public async intro(): Promise<void>
    {
        if (this.filters != null)
        {
            const alpha = this.filters[0] as PIXI.filters.AlphaFilter;
            alpha.alpha = 0;
            new Tween(alpha).to({ alpha: 1 }, 2000).delay(500).start();
        }
    }
    public async outro(): Promise<void>
    {
        console.log("outro() called");
    }
    public pause(): void
    {
        console.log("pause() called");
    }
    public async destroy(): Promise<void>
    {
        console.log("destroy() called");
    }

    public update(time: number, delta: number): void
    {
        if (!this.app) return;

        const { width, height } = this.app.resolution;

        if (this.grid)
        {
            this.grid.tilePosition.x += delta / 1000 * 50;
            this.grid.tilePosition.y += delta / 1000 * 50;
        }

        if (this.logo)
        {
            if (this.logo.filters)
            {
                const filter = this.logo.filters[0] as PIXI.filters.ColorMatrixFilter;
                filter.saturate(sin(time / 500 * PI) * 0.2);
            }

            this.logo.position.set(
                this.app.resolution.width / 2 + random() * 2.5,
                this.app.resolution.height / 2 + random() * 2.5);
        }
    }

    public async init(app: App): Promise<void>
    {
        this.app = app;

        app.stage.addChild(this);

        const bg = new PIXI.Sprite(PIXI.Texture.WHITE);
        bg.width = app.resolution.width;
        bg.height = app.resolution.height;
        this.addChild(bg);

        await new Promise(
            (resolve, reject) => app.loader
                .add("logo-stylized", require("@res/img/logo-stylized.png"))
                .load(resolve)
                .on("error", (loader, res) => reject(res)));

        //#region generate grid
        const gridGraphics = new PIXI.Graphics();
        gridGraphics.clear();
        gridGraphics.lineStyle(1.5, 0x000000, 0.5);

        for (let i = 0; i <= 128; i += 16)
        {
            gridGraphics
                .moveTo(i, 0)
                .lineTo(i, app.resolution.height);
        }

        for (let i = 0; i <= 128; i += 16)
        {
            gridGraphics
                .moveTo(0, i)
                .lineTo(app.resolution.width, i);
        }

        const gridTex = new PIXI.RenderTexture(new PIXI.BaseRenderTexture(128, 128));
        app.renderer.render(gridGraphics, gridTex);

        this.grid = new PIXI.extras.TilingSprite(gridTex, app.resolution.width, app.resolution.height);

        this.addChild(this.grid);
        //#endregion

        this.logo = new PIXI.Sprite(app.resources["logo-stylized"].texture);
        this.logo.anchor.set(0.5);
        this.logo.position.set(app.resolution.width / 2, app.resolution.height / 2);
        this.logo.filters = [new PIXI.filters.ColorMatrixFilter()];
        this.addChild(this.logo);

        const attribution = new PIXI.Text();
        attribution.text = "By Ibiyemi Abiodun";
        attribution.anchor.set(0, 1);
        attribution.position.set(10, app.resolution.height - 10);
        attribution.style.fontFamily = "Montserrat";
        attribution.style.stroke = 0xFFFFFF;
        attribution.style.strokeThickness = 3;
        attribution.style.fontWeight = "900";
        this.addChild(attribution);

        this.filters = [new PIXI.filters.AlphaFilter(1)];

        app.renderer.backgroundColor = 0;
    }
}