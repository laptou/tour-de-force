type GridOptions =
    {
        lineWidth: number;
        lineColor: number;
        alpha: number;
        spacing: number;
    }

export class Grid extends PIXI.extras.TilingSprite
{
    constructor(renderer: PIXI.SystemRenderer, width: number, height: number, options?: GridOptions)
    {
        const opts = { lineWidth: 1.5, lineColor: 0x000000, spacing: 16, alpha: 0.5, ...options };
        const gridGraphics = new PIXI.Graphics();
        gridGraphics.lineStyle(opts.lineWidth, opts.lineColor, opts.alpha);

        for (let i = 0; i <= opts.spacing * 80; i += opts.spacing)
        {
            gridGraphics
                .moveTo(i, 0)
                .lineTo(i, height);
        }

        for (let i = 0; i <= opts.spacing * 80; i += opts.spacing)
        {
            gridGraphics
                .moveTo(0, i)
                .lineTo(width, i);
        }

        const gridTex = new PIXI.RenderTexture(
            new PIXI.BaseRenderTexture(
                opts.spacing * 8, opts.spacing * 8,
                PIXI.SCALE_MODES.LINEAR));

        renderer.render(gridGraphics, gridTex);

        super(gridTex, width, height);
    }
}