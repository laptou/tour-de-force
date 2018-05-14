export enum GameMode {
    View,
    Force,
    KineticEnergy
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