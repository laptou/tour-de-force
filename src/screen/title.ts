import { App, ResumeParameters } from "..";
import { IScreen } from "./base";

export class TitleScreen extends PIXI.Container implements IScreen
{
    private logo: PIXI.Sprite | undefined;

    public resume(params: ResumeParameters): void
    {
        console.log("resume() called");
    }

    public async intro(): Promise<void>
    {
        console.log("intro() called");
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
    }

    public async init(app: App): Promise<void>
    {
        console.log("init() called");

        app.stage.addChild(this);

        await new Promise(
            (resolve, reject) => app.loader
                .add("logo-stylized", require("@res/img/logo-stylized.png"))
                .load(resolve)
                .on("error", (loader, res) => reject(res)));

        this.logo = new PIXI.Sprite(app.resources["logo-stylized"].texture);

        console.log(this.logo);

        this.addChild(this.logo);
        app.renderer.backgroundColor = 0x58C3D2;

        console.log("init() finished");
    }
}