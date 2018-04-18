import { ShockwaveFilter } from "@pixi/filter-shockwave";
import { Tween } from "@tweenjs/tween.js";
import * as PIXI from "pixi.js";

import { App, ResumeParameters } from "..";
import { IScreen } from "./base";

const { sin, cos, random, sqrt, PI } = Math;

export class TitleScreen extends PIXI.Container implements IScreen
{

    private grid: PIXI.extras.TilingSprite | undefined;
    private logo: PIXI.Sprite | undefined;
    private logoGroup: PIXI.Container | undefined;
    private app: App | undefined;

    public pointerdown(e: PIXI.interaction.InteractionEvent)
    {
        if (this.grid && !this.grid.filters)
        {
            this.grid.filters = [new ShockwaveFilter(e.data.getLocalPosition(this.grid), {
                wavelength: 200,
                amplitude: 200,
                speed: 800
            })];
        }

        if (this.app)
        {
            this.app.manager.pop();
        }
    }

    public resume(params: ResumeParameters): void
    {

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
    public outro(): Promise<void>
    {
        return new Promise(resolve =>
        {
            if (this.filters != null)
            {
                const alpha = this.filters[0] as PIXI.filters.AlphaFilter;
                new Tween(alpha).to({ alpha: 0 }, 2000).delay(500).onComplete(resolve).start();
            }
        });
    }

    public pause(): void
    {
        console.log("pause() called");
    }

    public async destroy(): Promise<void>
    {
        if (this.app)
            this.app.stage.removeChild(this);

        super.destroy({ children: true });
    }

    public update(time: number, delta: number): void
    {
        if (!this.app) return;

        const { width, height } = this.app.resolution;

        if (this.grid)
        {
            this.grid.tilePosition.x += delta / 1000 * 50;
            this.grid.tilePosition.y += delta / 1000 * 50;

            if (this.grid.filters)
            {
                const filter = this.grid.filters[0];

                if (filter instanceof ShockwaveFilter)
                {
                    filter.time += delta / 1000;

                    const diag = sqrt(this.app.resolution.height * this.app.resolution.height +
                        this.app.resolution.width * this.app.resolution.width);

                    if (filter.time * (filter as any).speed > diag)
                    {
                        this.grid.filters = null;
                    }
                }
            }
        }

        if (this.logo && this.logoGroup)
        {
            if (this.logoGroup.filters)
            {
                const filter = this.logoGroup.filters[0] as PIXI.filters.ColorMatrixFilter;
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
        this.app.stage.addChild(this);

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

        this.logoGroup = new PIXI.Container();
        this.logoGroup.filters = [new PIXI.filters.ColorMatrixFilter()];

        this.logo = new PIXI.Sprite(app.resources["logo-stylized"].texture);
        this.logo.anchor.set(0.5);
        this.logo.position.set(app.resolution.width / 2, app.resolution.height / 2);
        this.logoGroup.addChild(this.logo);

        const instructions = new PIXI.Text();
        instructions.text = "Click to start!";
        instructions.style.fontFamily = "Montserrat";
        instructions.style.fontWeight = "900";
        instructions.style.fill = 0xAA0000;
        instructions.style.stroke = 0xFFFFFF;
        instructions.style.strokeThickness = 3;
        instructions.anchor.set(0.5, 0);
        instructions.position.set(app.resolution.width / 2, app.resolution.height / 2 + 100);
        this.logoGroup.addChild(instructions);

        this.addChild(this.logoGroup);

        const attribution = new PIXI.Text();
        attribution.text = "By Ibiyemi Abiodun";
        attribution.anchor.set(0, 1);
        attribution.position.set(10, app.resolution.height - 10);
        attribution.style.fontFamily = "Clear Sans";
        attribution.style.fontSize = 12;
        attribution.style.stroke = 0xFFFFFF;
        attribution.style.strokeThickness = 3;
        attribution.style.fontWeight = "500";
        this.addChild(attribution);

        this.filters = [new PIXI.filters.AlphaFilter(1)];

        this.interactive = true;
        this.interactiveChildren = false;
        this.hitArea = new PIXI.Rectangle(0, 0, app.resolution.width, app.resolution.height);
        // NOTE: this class has a method called pointerdown
        // this gets called by event listener automatically, which means there is no need
        // for .on(); that will make the event get called TWICE

        app.renderer.backgroundColor = 0;
    }
}