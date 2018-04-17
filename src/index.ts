import { IScreen } from "./screen/base";
import { last } from "./util";

interface RenderParameters 
{
    timestamp: number;
    resolution: { x: number; y: number; };
    renderer: PIXI.WebGLRenderer | PIXI.CanvasRenderer;
}

class App
{
    private pixi: PIXI.Application;

    constructor()
    {
        this.pixi = new PIXI.Application({ autoResize: true });
        this.pixi.start();

        document.body.appendChild(this.pixi.view);
    }
}

class ScreenManager 
{
    private backStack: IScreen[] = [];
    private renderStack: IScreen[] = [];

    public push(screen: IScreen, replace: boolean = true)
    {
        if (replace) this.renderStack = [screen];
        else this.renderStack.push(screen);

        this.backStack.push(screen);
    }

    public pop()
    {
        this.backStack.pop();
        this.renderStack.pop();

        if (this.renderStack.length == 0)
            this.renderStack = [last(this.backStack)];
    }

    public render(params: RenderParameters)
    {
        for (const screen of this.renderStack)
        {
            screen.render(params);
        }
    }
}