import { Easing, Tween } from "@tweenjs/tween.js";
import * as PIXI from "pixi.js";

import { App, ResumeParameters } from "..";
import { Grid } from "../control/grid";
import { noop, promise } from "../util";
import { IScreen } from "./base";

const { sin, cos, random, sqrt, PI } = Math;

class LevelTile extends PIXI.Container
{
    public level: number;

    private sprite: PIXI.Sprite;

    constructor(app: App, level: number)
    {
        super();

        this.level = level;

        const tex = app.resources["control-sprites"].texture;
        tex.frame = new PIXI.Rectangle(0, 0, 128, 128);

        this.sprite = new PIXI.Sprite(tex);
        this.sprite.anchor.set(0.5);
        this.sprite.position.set(64);

        const label = new PIXI.Text((level + 1).toString(),
            {
                fontFamily: "Montserrat",
                fontWeight: "900",
                fontSize: "24pt",
                fill: 0xFFFFFF,
            });
        label.anchor.set(0.5);
        label.position.set(64);
        label.cacheAsBitmap = true;

        this.addChild(this.sprite);
        this.addChild(label);

        this.interactive = true;
        this.buttonMode = true;
    }

    private pointerdown()
    {
        new Tween(this.sprite.scale).to({ x: 0.9, y: 0.9 }, 100).start();
    }

    private pointerup()
    {
        new Tween(this.sprite.scale).to({ x: 1, y: 1 }, 100).start();
    }
}

export class LevelScreen extends PIXI.Container implements IScreen
{
    private hitPoint: PIXI.Point | undefined;
    private app: App | undefined;
    private levels: PIXI.Container | undefined;
    private grid: PIXI.extras.TilingSprite | undefined;
    private title: PIXI.Text | undefined;
    private pulse: PIXI.filters.ColorMatrixFilter | undefined;

    public gotoLevel(e: PIXI.interaction.InteractionEvent, level: number)
    {
        this.hitPoint = e.data.getLocalPosition(this);

        if (this.app) this.app.manager.pop();
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

        this.pulse = new PIXI.filters.ColorMatrixFilter();

        this.title = new PIXI.Text("Choose a level");
        this.title.style.fontFamily = "Montserrat";
        this.title.style.fontWeight = "900";
        this.title.style.fontSize = "32pt";
        this.title.style.fill = 0xAA0000;
        this.title.style.stroke = 0xFFFFFF;
        this.title.style.strokeThickness = 3;
        this.title.filters = [this.pulse];

        this.title.anchor.set(0, 1);
        this.title.x = 20;

        this.addChild(this.title);

        this.levels = new PIXI.Container();
        this.levels.interactiveChildren = true;

        for (let r = 0; r < 3; r++)
        {
            for (let c = 0; c < 5; c++)
            {
                const levelTile = new LevelTile(app, r * 5 + c);
                levelTile.position.set(c * 128, r * 128);
                levelTile.on("pointerover", () => levelTile.filters = this.pulse ? [this.pulse] : null);
                levelTile.on("pointerout", () => levelTile.filters = null);
                levelTile.on("pointerdown", (e: PIXI.interaction.InteractionEvent) => this.gotoLevel(e, r * 5 + c));

                this.levels.addChild(levelTile);
            }
        }

        const { width, height } = app.resolution;
        const levelTableBounds = this.levels.getBounds();
        this.levels.position.set(
            (width - levelTableBounds.width) / 2,
            (height - levelTableBounds.height) / 2);

        this.addChild(this.levels);

        app.stage.addChild(this);

    }

    public resume(params: ResumeParameters): void
    {
    }

    public async intro(): Promise<void>
    {
        if (this.filters == null)
            this.filters = [new PIXI.filters.AlphaFilter(0)];


        const alpha = this.filters[0] as PIXI.filters.AlphaFilter;
        await promise(new Tween(alpha).to({ alpha: 1 }, 500).start());
        this.filters = null; // remove filters when not in use to increase performance

        if (this.title != null)
        {
            await promise(new Tween(this.title.position).to({ y: 75 }, 750).easing(Easing.Back.Out).start());
        }
    }

    public outro(): Promise<void>
    {
        if (!this.app) return noop();

        const { width, height } = this.app.resolution;

        const mask = new PIXI.Graphics();
        const diag = sqrt(width * width + height * height);
        mask.beginFill(0xFFFFFF, 1);
        mask.drawCircle(width / 2, height / 2, diag);
        mask.endFill();

        if (this.hitPoint) mask.position.set(this.hitPoint.x, this.hitPoint.y);

        this.mask = mask;

        this.addChild(mask);

        return promise(
            new Tween(this.mask.scale)
                .to({ x: 0, y: 0 }, 500)
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
        if (this.grid)
        {
            this.grid.tilePosition.x = time / 20 % 2000;
            this.grid.tilePosition.y = time / 20 % 2000;
        }

        if (this.pulse)
        {
            this.pulse.saturate(sin(time / 500 * PI) * 0.4);
        }
    }
}