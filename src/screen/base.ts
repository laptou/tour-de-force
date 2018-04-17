import { App, RenderParameters, ResumeParameters } from "..";

export interface IScreen
{
    init(app: App): Promise<void>;
    resume(params: ResumeParameters): Promise<void>;
    intro(): Promise<void>;
    outro(): Promise<void>;
    pause(): Promise<void>;
    destroy(): Promise<void>;
    render(params: RenderParameters): void;
}