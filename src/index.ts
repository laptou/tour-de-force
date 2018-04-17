import { IScreen } from "./screen/base";
import { TitleScreen } from "./screen/title";
import { last } from "./util";

export interface RenderParameters 
{
    timestamp: number;
    resolution: { x: number; y: number; };
    renderer: PIXI.WebGLRenderer | PIXI.CanvasRenderer;
}

export interface ResumeParameters
{
    timestamp: number;
}

export class App
{
    private pixi: PIXI.Application;
    private manager: ScreenManager;

    get loader()
    {
        return this.pixi.loader;
    }

    constructor()
    {
        this.pixi = new PIXI.Application({ autoResize: true });
        this.pixi.start();
        this.pixi.ticker.add(this.render);

        const s = new TitleScreen();
        this.manager = new ScreenManager();
        this.manager.push(s, true);
        s.init(this);

        document.body.appendChild(this.pixi.view);
    }

    public render(deltaTime: number): any
    {
        this.manager.render({
            renderer: this.pixi.renderer,
            timestamp: this.pixi.ticker.lastTime,
            resolution: { x: 0, y: 0 }
        })
    }
}

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
                await s.pause();
                s.destroy();
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
        screen.intro();
    }

    public pop()
    {
        this.backStack.pop();
        this.renderStack.pop();

        const next = last(this.backStack);

        if (next) this.renderStack = [next];
    }

    public render(params: RenderParameters)
    {
        for (const screen of this.renderStack)
        {
            screen.render(params);
        }
    }
}