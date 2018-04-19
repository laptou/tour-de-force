import * as PIXI from "pixi.js";

export class TestFilter extends PIXI.Filter<any>
{
    get delta(): number
    {
        return this.uniforms.delta;
    }

    set delta(v: number)
    {
        this.uniforms.delta = v;
    }

    constructor()
    {
        super();
        this.fragmentSrc = require("@res/shader/field");
    }
}