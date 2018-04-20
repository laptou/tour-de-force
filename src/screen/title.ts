import { ShockwaveFilter } from "@pixi/filter-shockwave";
import { LevelScreen } from "@screen/level";
import { Tween } from "@tweenjs/tween.js";
import * as PIXI from "pixi.js";

import { App, ResumeParameters } from "..";
import { Grid } from "../control/grid";
import { promise } from "../util";
import { IScreen } from "./base";

const { sin, cos, random, sqrt, PI } = Math;

export class TitleScreen extends PIXI.Container implements IScreen
{

    private instructions: PIXI.Text | undefined;
    private grid: Grid | undefined;
    private logo: PIXI.Sprite | undefined;
    private app: App | undefined;

    public pointerdown(e: PIXI.interaction.InteractionEvent)
    {
        if (this.grid && !this.grid.filters)
        {
            this.grid.filters = [new ShockwaveFilter(e.data.getLocalPosition(this.grid), {
                wavelength: 200,
                amplitude: 200,
                speed: 2400
            })];
        }

        if (this.app)
        {
            const next = new LevelScreen();
            next.init(this.app)
                .then(() => this.app && this.app.manager.push(next, true))
                .catch(null);
        }
    }

    public resume(params: ResumeParameters): void
    {

    }

    public async intro(): Promise<void>
    {
        if (this.filters == null)
            this.filters = [new PIXI.filters.AlphaFilter(0)];

        const alpha = this.filters[0] as PIXI.filters.AlphaFilter;
        await promise(new Tween(alpha).to({ alpha: 1 }, 500).delay(500).start());
    }

    public async outro(): Promise<void>
    {
        if (this.filters == null)
            this.filters = [new PIXI.filters.AlphaFilter(1)];

        const alpha = this.filters[0] as PIXI.filters.AlphaFilter;
        await promise(new Tween(alpha).to({ alpha: 0 }, 500).delay(1000).start());
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
            this.grid.tilePosition.x = time / 20 % 2000;
            this.grid.tilePosition.y = time / 20 % 2000;
        }

        if (this.logo)
        {
            this.logo.position.set(
                width / 2 + random() * 2.5,
                height / 2 + random() * 2.5);
        }

        if (this.grid && this.grid.filters)
        {
            const shockwave = this.grid.filters[0] as ShockwaveFilter;
            shockwave.time += delta / 1000;
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
                .add("item-sprites", require("@res/img/item-sprites.png"))
                .add("control-sprites", require("@res/img/control-sprites.png"))
                .load(resolve)
                .on("error", (loader, res) => reject(res)));


        this.grid = new Grid(app.renderer, app.resolution.width, app.resolution.height);
        this.addChild(this.grid);

        this.logo = new PIXI.Sprite(app.resources["logo-stylized"].texture);
        this.logo.anchor.set(0.5);
        this.logo.position.set(app.resolution.width / 2, app.resolution.height / 2);
        this.addChild(this.logo);

        this.instructions = new PIXI.Text();
        this.instructions.text = "Click to start!";
        this.instructions.style.fontFamily = "Montserrat";
        this.instructions.style.fontWeight = "900";
        this.instructions.style.fill = 0xAA0000;
        this.instructions.style.stroke = 0xFFFFFF;
        this.instructions.style.strokeThickness = 3;
        this.instructions.anchor.set(0.5, 0);
        this.instructions.position.set(app.resolution.width / 2, app.resolution.height / 2 + 100);
        this.instructions.cacheAsBitmap = true;
        this.addChild(this.instructions);

        const attribution = new PIXI.Text();
        attribution.text = "© 2018 Ibiyemi Abiodun";
        attribution.anchor.set(0, 1);
        attribution.position.set(10, app.resolution.height - 10);
        attribution.style.fontFamily = "Clear Sans";
        attribution.style.fontSize = "10pt";
        attribution.style.stroke = 0xFFFFFF;
        attribution.style.strokeThickness = 3;
        attribution.style.fontWeight = "500";
        attribution.cacheAsBitmap = true;
        this.addChild(attribution);


        this.interactive = true;
        this.interactiveChildren = false;
        this.hitArea = new PIXI.Rectangle(0, 0, app.resolution.width, app.resolution.height);
        // NOTE: this class has a method called pointerdown
        // this gets called by event listener automatically, which means there is no need
        // for .on(); that will make the event get called TWICE

        app.renderer.backgroundColor = 0;
    }
}

