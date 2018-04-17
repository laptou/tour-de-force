import * as PIXI from "pixi.js";

import { IScreen } from "./screen/base";
import { TitleScreen } from "./screen/title";
import { last } from "./util";

class ScreenManager 
{
    private backStack: IScreen[] = [];
    private renderStack: IScreen[] = [];

    public push(screen: IScreen, replace: boolean = true)
    {
        if (replace)
        {
            this.renderStack.forEach(async s =>
            {
                await s.outro();

                s.pause();

                await s.destroy();
            });

            this.renderStack = [screen];
        }
        else
        {
            const current = last(this.renderStack);
            if (current)
                current.pause();

            this.renderStack.push(screen);
        }

        this.backStack.push(screen);

        screen.resume({ timestamp: 0 });
        screen.intro().catch(null);
    }

    public pop()
    {
        this.backStack.pop();
        this.renderStack.pop();

        const next = last(this.backStack);

        if (next) this.renderStack = [next];
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
    private pixi: PIXI.Application;
    private manager: ScreenManager;
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

    constructor()
    {
        this.pixi = new PIXI.Application({ autoResize: true });
        this.renderer.view.style.position = "absolute";
        this.renderer.view.style.display = "block";
        this.renderer.autoResize = true;
        this.renderer.resize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.pixi.view);

        const s = new TitleScreen();
        s.init(this).catch(alert);

        this.manager = new ScreenManager();
        this.manager.push(s, true);

        this.pixi.start();

        requestAnimationFrame(this.render.bind(this));
    }

    public render(time: number): any
    {
        const delta = time - (this.lastFrame === -1 ? time : this.lastFrame);
        this.lastFrame = time;

        this.manager.update(time, delta);
        this.pixi.render();

        requestAnimationFrame(this.render.bind(this));
    }
}


const app = new App();