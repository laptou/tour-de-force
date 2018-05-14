
enum GameMode {
    View,
    Force,
    KineticEnergy
}

enum ControlAlignment {
    Left = 1,
    Right = 2,
    Center = 4,
    Top = 8,
    Bottom = 16
}

interface HudButtonConfig {
    text: string;
    tooltip: string;
    sprite: string;
    frame: number;

    align?: ControlAlignment;
    offset?: { x: number, y: number };
    handler?: Function;
}

interface ModeHudButtonConfig extends HudButtonConfig {
    grey?: boolean;
    mode: GameMode;
}