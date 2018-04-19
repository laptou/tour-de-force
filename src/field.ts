import { TestFilter } from "@shader/test";

export class Field extends PIXI.Sprite
{
    public width: number;
    public height: number;

    private renderer: PIXI.WebGLRenderer;
    private filter: TestFilter;

    constructor(renderer: PIXI.WebGLRenderer, width: number, height: number)
    {
        const tex = new PIXI.RenderTexture(new PIXI.BaseRenderTexture(width, height));

        super(tex);

        this.filter = new TestFilter();
        this.renderer = renderer;
        this.width = width;
        this.height = height;
    }

    public update(delta: number)
    {
        this.filter.delta = delta;
        // this.filter.apply(this.renderer.filterManager, this.target, this.texture as RenderTexture, true);
    }
}