import { Button } from "@control/button";
import { Scene } from "phaser";

export enum GameMode {
    View,
    Force,
    Velocity,
    Mass,
}

export enum ControlAlignment {
    Left = 1,
    Right = 2,
    Center = 4,
    Top = 8,
    Bottom = 16
}

export interface HudButtonConfig {
    text: string;
    tooltip: string;
    sprite: string;
    frame: number;

    align?: ControlAlignment;
    offset?: { x: number, y: number };
    handler?: Function;
}

export interface ModeHudButtonConfig extends HudButtonConfig {
    grey?: boolean;
    mode: GameMode;
}

export class HudButton extends Button {
    constructor(scene: Scene, config: HudButtonConfig) {
        const { height, width } = scene.cameras.main;

        const c = {
            align: ControlAlignment.Left,
            ...config
        };

        let offset = c.offset || { x: 0, y: 0 };

        if ((c.align & ControlAlignment.Right) === ControlAlignment.Right)
            offset = { x: width - offset.x, y: offset.y };

        if ((c.align & ControlAlignment.Bottom) === ControlAlignment.Bottom)
            offset = { x: offset.x, y: height - offset.y };

        super(scene, {
            ...offset,
            text: {
                text: c.text,
                style: {
                    fontFamily: "Clear Sans",
                    fontStyle: "bold",
                    fontSize: 24,
                    fill: "white"
                }
            },
            sprite: {
                key: c.sprite,
                frame: c.frame,
                scale: 0.5
            },
            tooltip: {
                text: c.tooltip,
                style: {
                    fontFamily: "Clear Sans",
                    fontSize: 12,
                    fill: "white"
                }
            }
        });

        if (c.handler) this.on("pointerdown", c.handler);
    }
}