export interface IScreen
{
    init(): void;
    resume(): void;
    pause(): void;
    destroy(): void;
    render(params: RenderParameters): void;
}