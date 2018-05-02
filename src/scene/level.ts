import * as Phaser from "phaser";

const { sin, cos, random, PI, max } = Math;

export class LevelScene extends Phaser.Scene {

    private grid: Phaser.GameObjects.TileSprite | undefined;

    constructor() {
        super({ key: "level" });
    }

    public init(data: any) {
        console.log('init', data);
    }

    public preload() {
        this.events.on("transitioncomplete", this.transitioncomplete, this);
    }

    public create() {
        const { width, height } = this.cameras.main;
        const self = this as any;
        this.grid = this.add.tileSprite(width / 2, height / 2, width, height, "tile");
    }

    public update(total: number, delta: number) {
    }

    public transitioncomplete() {
    }

    private outro(progress: number) {
    }
}