export const enum GameMode {
    View = "view",
    Force = "force",
    Velocity = "velocity",
    Mass = "mass"
}

export const enum TileType {
    Wood = "wood",
    Steel = "steel",
    Aluminum = "aluminum"
}

export interface TileData {
    x: number;
    y: number;
    type: TileType;
    track?: boolean;
    show?: { mass?: boolean; }
}

export interface LevelData {
    index: number;
    size: number;
    modes: GameMode[];
    content: TileData[];
}

export enum ObjectiveType {
    Position,
    Velocity,
    Speed,
    Momentum,
    AngularVelocity
}

export interface ObjectiveConfig {
    target: { minimum: number; maximum: number } | number;
    type: ObjectiveType;
    allowedTiles: TileType[];
}

export class Objective {
    public minimum: number;
    public maximum: number;
    public type: ObjectiveType;
    public allowedTiles: TileType[];


    public constructor(config: ObjectiveConfig) {
        if (typeof config.target === "object") {
            const { minimum, maximum } = config.target;
            [this.minimum, this.maximum] = [minimum, maximum];
        }
        else {
            this.minimum = this.maximum = config.target;
        }

        this.type = config.type;
        this.allowedTiles = config.allowedTiles;
    }
}

export enum GoalType {
    Required,
    Bonus
}