import { ShockwaveFilter } from "@pixi/filter-shockwave";
<<<<<<< HEAD
=======
import { LevelScreen } from "@screen/level";
>>>>>>> title-screen
import { Tween } from "@tweenjs/tween.js";
import * as PIXI from "pixi.js";

import { App, ResumeParameters } from "..";
import { Grid } from "../control/grid";
<<<<<<< HEAD
import { IScreen } from "./base";
import { LevelScreen } from "./level";
=======
import { promise } from "../util";
import { IScreen } from "./base";
>>>>>>> title-screen

const { sin, cos, random, sqrt, PI } = Math;

export class TitleScreen extends PIXI.Container implements IScreen
{

<<<<<<< HEAD
    private grid: Grid | undefined;
    private logo: PIXI.Sprite | undefined;
    private logoGroup: PIXI.Container | undefined;
=======
    private instructions: PIXI.Text | undefined;
    private grid: Grid | undefined;
    private logo: PIXI.Sprite | undefined;
>>>>>>> title-screen
    private app: App | undefined;

    public pointerdown(e: PIXI.interaction.InteractionEvent)
    {
        if (this.grid && !this.grid.filters)
        {
<<<<<<< HEAD
            const shockwave = new ShockwaveFilter(e.data.getLocalPosition(this.grid), {
                wavelength: 200,
                amplitude: 200,
                speed: 2400
            });
            this.grid.filters = [shockwave];
            new Tween(shockwave).to({ time: 5 }, 5000).start();
=======
            this.grid.filters = [new ShockwaveFilter(e.data.getLocalPosition(this.grid), {
                wavelength: 100,
                amplitude: 100,
                speed: 2400
            })];
>>>>>>> title-screen
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

<<<<<<< HEAD
    public intro(): Promise<void>
    {
        return new Promise(resolve =>
        {
            if (this.filters != null)
            {
                const alpha = this.filters[0] as PIXI.filters.AlphaFilter;
                alpha.alpha = 0;
                new Tween(alpha).to({ alpha: 1 }, 2000).delay(500).onComplete(resolve).start();
            }
        });
    }

    public outro(): Promise<void>
    {
        return new Promise(resolve =>
        {
            if (this.filters != null)
            {
                const alpha = this.filters[0] as PIXI.filters.AlphaFilter;
                new Tween(alpha).to({ alpha: 0 }, 500).delay(500).onComplete(resolve).start();
            }
        });
=======
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
>>>>>>> title-screen
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

<<<<<<< HEAD
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
=======
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
>>>>>>> title-screen
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

<<<<<<< HEAD
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
=======
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
>>>>>>> title-screen

        const attribution = new PIXI.Text();
        attribution.text = "© 2018 Ibiyemi Abiodun";
        attribution.anchor.set(0, 1);
        attribution.position.set(10, app.resolution.height - 10);
        attribution.style.fontFamily = "Clear Sans";
        attribution.style.fontSize = "10pt";
        attribution.style.stroke = 0xFFFFFF;
        attribution.style.strokeThickness = 3;
        attribution.style.fontWeight = "500";
<<<<<<< HEAD
        this.addChild(attribution);

        this.filters = [new PIXI.filters.AlphaFilter(1)];
=======
        attribution.cacheAsBitmap = true;
        this.addChild(attribution);

>>>>>>> title-screen

        this.interactive = true;
        this.interactiveChildren = false;
        this.hitArea = new PIXI.Rectangle(0, 0, app.resolution.width, app.resolution.height);
        // NOTE: this class has a method called pointerdown
        // this gets called by event listener automatically, which means there is no need
        // for .on(); that will make the event get called TWICE

        app.renderer.backgroundColor = 0;
    }
}

