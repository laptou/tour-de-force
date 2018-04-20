import * as TWEEN from "@tweenjs/tween.js";
import * as PIXI from "pixi.js";

import { IScreen } from "./screen/base";
import { TitleScreen } from "./screen/title";
import { last } from "./util";

<<<<<<< HEAD
=======
const Stats = require("stats.js");
const stats = new Stats();
stats.showPanel(0);

>>>>>>> title-screen
class ScreenManager 
{
    private backStack: IScreen[] = [];
    private renderStack: IScreen[] = [];

    public push(screen: IScreen, replace: boolean = true)
    {
        if (replace)
        {
<<<<<<< HEAD

=======
>>>>>>> title-screen
            Promise.all(this.renderStack.map(async s =>
            {
                await s.outro();

                s.pause();

                await s.destroy();
            })).then(() => this.renderStack = [screen]).catch(console.error);
        }
        else
        {
            const current = last(this.renderStack);
            if (current)
                current.pause();
<<<<<<< HEAD
        }

        this.backStack.push(screen);
=======

            this.backStack.push(screen);
        }
>>>>>>> title-screen

        screen.resume({ timestamp: 0 });
        screen.intro().catch(null);

        this.renderStack.push(screen);
    }

    public pop()
    {
        const hist = last(this.backStack);
        const view = last(this.renderStack);

        if (hist === view) this.backStack.pop();

        if (view != null)
            (async s =>
            {
                await s.outro();

                s.pause();

                this.renderStack.pop();

                if (this.renderStack.length == 0)
                {
                    const next = last(this.backStack);


                    if (next != null)
                    {
                        next.resume({ timestamp: 0 });
                        await next.intro();

                        this.renderStack = [next];
                    }
                }
                else
                {
                    const next = last(this.renderStack);

                    if (next != null)
                    {
                        next.resume({ timestamp: 0 });
                    }
                }

                await s.destroy();

            })(view).catch(null);
    }

    public update(time: number, delta: number)
    {
        for (const screen of this.renderStack)
        {
            screen.update(time, delta);
        }
    }
}

export interface RenderParameters 
{
    timestamp: number;
    resolution: { x: number; y: number; };
    renderer: PIXI.WebGLRenderer;
}

export interface ResumeParameters
{
    timestamp: number;
}

export class App
{
    public manager: ScreenManager;

    private pixi: PIXI.Application;
    private lastFrame: number = -1;

    get loader()
    {
        return this.pixi.loader;
    }

    get stage()
    {
        return this.pixi.stage;
    }

    get resources()
    {
        return this.pixi.loader.resources;
    }

    get renderer() 
    {
        return this.pixi.renderer;
    }

    get resolution()
    {
        return this.pixi.renderer.screen;
    }

    constructor()
    {
        const scale = window.devicePixelRatio;
        PIXI.settings.RESOLUTION = scale;
        PIXI.settings.FILTER_RESOLUTION = scale;

        this.pixi = new PIXI.Application({ resolution: 2 });

        this.renderer.resize(window.innerWidth, window.innerHeight);

        const view = this.pixi.view;
        document.body.appendChild(view);
<<<<<<< HEAD
=======
        document.body.appendChild(stats.dom);
>>>>>>> title-screen

        const s = new TitleScreen();
        s.init(this).then(() => this.manager.push(s, true)).catch(console.error);

        this.manager = new ScreenManager();

        this.pixi.start();
        this.pixi.ticker.add(this.render, this);
    }

    public render(): any
    {
<<<<<<< HEAD
        TWEEN.update(this.pixi.ticker.lastTime);
        this.manager.update(this.pixi.ticker.lastTime, this.pixi.ticker.elapsedMS);
        this.pixi.render();
=======
        stats.begin();
        TWEEN.update(this.pixi.ticker.lastTime);
        this.manager.update(this.pixi.ticker.lastTime, this.pixi.ticker.elapsedMS);
        this.pixi.render();
        stats.end();
>>>>>>> title-screen
    }

}


const app = new App();