import { App, ResumeParameters } from "..";

export interface IScreen
{
    init(app: App): Promise<void>;
    resume(params: ResumeParameters): void;
    intro(): Promise<void>;
    outro(): Promise<void>;
    pause(): void;
    destroy(): Promise<void>;
    update(time: number, delta: number): void;
}