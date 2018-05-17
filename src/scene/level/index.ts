import { GameMode, LevelData } from "@lib/level";
import { LevelHud } from "@scene/level/hud";
import { LevelState } from "@scene/level/state";
import { HudButton } from "@scene/util/ui";
import * as Phaser from "phaser";

import { Tile } from "./tile";

const { sin, cos, random, PI, max, min, abs } = Math;

export class LevelScene extends Phaser.Scene {

    public level!: LevelData | number;
    public state!: LevelState;
    private hud!: LevelHud;

    private pan = { x: 0, y: 0 };

    private tiles!: Phaser.GameObjects.Container;
    private grid!: Phaser.GameObjects.TileSprite;

    constructor() {
        super({ key: "level" });
    }

    public init(data: any) {
        console.log('init', data);

        this.level = data.level;
    }

    public preload() {
        if (!("tile-level" in this.textures.list)) {
            const graphics = this.make.graphics({}, false);

            graphics
                .fillStyle(0xFFFFFF)
                .fillRect(0, 0, 80, 80)
                .lineStyle(3, 0x000000, 1)
                .lineBetween(0, 0, 0, 128)
                .lineBetween(0, 0, 128, 0)
                .lineStyle(1, 0x000000, 1)
                .lineBetween(32, 0, 32, 128)
                .lineBetween(0, 32, 128, 32)
                .lineBetween(64, 0, 64, 128)
                .lineBetween(0, 64, 128, 64)
                .lineBetween(96, 0, 96, 128)
                .lineBetween(0, 96, 128, 96);

            graphics.generateTexture("tile-level", 128, 128);

            graphics.destroy();
        }

        if (!("sprites" in this.textures.list))
            this.load.spritesheet("sprites", require("@res/img/item-sprites.png"), { frameWidth: 128, frameHeight: 128 });

        if (!("controls" in this.textures.list))
            this.load.spritesheet("controls", require("@res/img/control-sprites.png"), { frameWidth: 128, frameHeight: 128 });

    }

    public create() {
        this.state = new LevelState();

        this.createWorld();

        this.hud = new LevelHud(this);
        this.add.existing(this.hud);

        this.loadWorld();
    }

    public update(total: number, delta: number) {
        const cam = this.cameras.main;
        const { height, width } = cam;
        const gameWidth = (this.level as LevelData).size * 32;

        // update camera

        if (this.state.track) {
            cam.scrollX = this.state.track.x - width / 2;
        }
    }

    private createWorld() {
        const cam = this.cameras.main;
        const { height, width } = cam;

        // load the level
        this.level = require(`@res/level/${0}.json`) as LevelData;

        // set up camera and physics
        const gameWidth = this.level.size * 32, gameHeight = height - 100;

        cam.setBounds(-50, 0, gameWidth + 100, height);

        this.grid = this.add.tileSprite(gameWidth / 2, height / 2, gameWidth, gameHeight, "tile-level");
        this.grid.flipY = true;

        this.matter.world.setBounds(0, 50, gameWidth, gameHeight, 512);
        const walls = this.matter.world.walls as { left: Matter.Body; right: Matter.Body; top: Matter.Body; bottom: Matter.Body };

        walls.top.friction = 0;
        walls.top.restitution = 0;

        walls.bottom.friction = 0;
        walls.bottom.restitution = 0;

        walls.left.friction = 0;
        walls.left.restitution = 0;

        walls.right.friction = 0;
        walls.right.restitution = 0;

        // add the tiles
        this.tiles = this.make.container({});
    }

    private loadWorld() {
        if (typeof this.level === "number") return;

        for (const mode of [GameMode.Mass, GameMode.Velocity, GameMode.Force]) {
            if (this.level.modes.indexOf(mode) === -1) {
                const btn = this.hud.getByName(mode) as HudButton;
                btn.setVisible(false);
                btn.setActive(false);
            }
        }

        for (const config of this.level.content) {
            const tile = new Tile(this, config);

            tile.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
                this.events.emit("tiledown", pointer, tile);
            });

            if (config.track)
                this.state.track = tile;

            this.tiles.add(tile);
        }
    }
}