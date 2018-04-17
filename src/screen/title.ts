import { promisify } from "util";

import { App, RenderParameters, ResumeParameters } from "..";
import { IScreen } from "./base";

export class TitleScreen implements IScreen
{
    public async init(app: App): Promise<void>
    {
        await promisify(app.loader.add("../../res/img/Logo Stylized.png").load);

    }

    public resume(params: ResumeParameters): Promise<void>
    {
        throw new Error("Method not implemented.");
    }

    public intro(): Promise<void>
    {
        throw new Error("Method not implemented.");
    }

    public outro(): Promise<void>
    {
        throw new Error("Method not implemented.");
    }

    public pause(): Promise<void>
    {
        throw new Error("Method not implemented.");
    }

    public destroy(): Promise<void>
    {
        throw new Error("Method not implemented.");
    }

    public render(params: RenderParameters): void
    {
        throw new Error("Method not implemented.");
    }
}