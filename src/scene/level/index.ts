import { AnnotationType, LevelData } from "@lib/level";
import { LevelBanner, LevelBannerType } from "@scene/level/banner";
import { Goal } from "@scene/level/goal";
import { LevelHud } from "@scene/level/hud";
import { LevelState } from "@scene/level/state";
import { Size, SizeLike, Vector, VectorLike } from "@util/math";
import * as Phaser from "phaser";

import { Text } from "../../config";
import { Tile } from "./tile";

const { sin, cos, random, PI, max, min, abs } = Math;

export class LevelScene extends Phaser.Scene {

    public level!: LevelData | number;
    public state!: LevelState;

    public bounds!: SizeLike;
    public padding!: SizeLike;
    public origin!: VectorLike;

    private hud!: LevelHud;
    private banner?: LevelBanner;

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

        if (!("banners" in this.textures.list))
            this.load.spritesheet("banners", require("@res/img/banner-sprites.png"), { frameWidth: 640, frameHeight: 128 });
    }

    public create() {
        this.state = new LevelState();

        this.createWorld();
        this.loadWorld();

        this.hud = new LevelHud(this);
        this.add.existing(this.hud);

        // this.matter.world.createDebugGraphic();
        // this.matter.world.drawDebug = true;
    }

    public update(total: number, delta: number) {
        const cam = this.cameras.main;
        const width = min(cam.width, this.bounds.width);

        if (this.state.track) {
            cam.scrollX = this.state.track.x - width / 2;
            // cam.scrollY = this.state.track.y - this.bounds.height / 2;
        }

        this.hud.update();
    }

    private createWorld() {

        const cam = this.cameras.main;
        const { height, width } = cam;

        // load the level
        this.level = require(`@res/level/${0}.json`) as LevelData;

        // set up camera and physics        
        this.bounds = new Size(this.level.width * 32, this.level.height * 32);

        this.padding = new Size(
            max(50, (width - this.bounds.width) / 2),
            max(50, (height - this.bounds.height) / 2));

        this.origin = new Vector(this.padding.width, this.bounds.height + this.padding.height);

        cam.setBounds(
            0, 0,
            this.bounds.width + this.padding.width * 2,
            this.bounds.height + this.padding.height * 2);

        this.grid = this.add.tileSprite(
            this.padding.width + this.bounds.width / 2,
            this.padding.height + this.bounds.height / 2,
            this.bounds.width,
            this.bounds.height,
            "tile-level");

        this.grid.flipY = true;

        this.matter.world.setBounds(
            this.padding.width,
            this.padding.height,
            this.bounds.width,
            this.bounds.height,
            512);

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

        this.state.modes = this.level.modes;
        this.state.level = this.level;

        for (const data of this.level.annotations) {
            switch (data.type) {
                case AnnotationType.Text:
                    const textAnnotation = this.make.text({
                        style: {
                            ...Text.Header,
                            stroke: "#FFFFFF",
                            strokeThickness: 10
                        },
                        text: data.text,
                        x: this.origin.x + data.x * 32,
                        y: this.origin.y - data.y * 32,
                        origin: { x: 0, y: 1 }
                    });

                    this.tiles.add(textAnnotation);
                    break;
                default:
                    // invalid annotation
                    // don't throw error i guess
                    break;
            }
        }

        for (const data of this.level.goals) {
            // invert Y coordinate so Y = 0 is at the bottom
            data.y = this.origin.y / 32 - data.y;
            data.x = this.origin.x / 32 + data.x;

            const goal = new Goal(this, data);

            goal.on("update:completed", (completed: boolean) => {
                if (this.state.goals.every(g => g.completed)) {
                    this.levelCompleted();
                }
            });

            this.state.goals.push(goal);
            this.tiles.add(goal);
        }

        for (const data of this.level.tiles) {
            // invert Y coordinate so Y = 0 is at the bottom
            data.y = this.origin.y / 32 - data.y;
            data.x = this.origin.x / 32 + data.x;

            const tile = new Tile(this, data);

            tile.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
                this.events.emit("tiledown", pointer, tile);
            });

            if (data.track)
                this.state.track = tile;

            this.state.tiles.push(tile);
            this.tiles.add(tile);
        }
    }

    private levelCompleted() {
        this.state.completed = true;

        this.banner = new LevelBanner(this, LevelBannerType.Success);
        this.add.existing(this.banner);

        const { scrollX, scrollY, width, height } = this.cameras.main;

        this.banner.setPosition(scrollX + width / 2, scrollY + height / 2);
        this.banner.begin();

        this.scene.transition({
            target: "level-select",
            duration: 2000,
            onUpdate: this.ontransitionupdate
        });
    }

    private ontransitionupdate(progress: number) {
    }
}