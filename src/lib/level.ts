import { VectorLike } from "@util/math";

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

export interface GoalData {
    minimum?: number | VectorLike;
    maximum?: number | VectorLike;
    type: GoalType;
    x: number;
    y: number;
    width: number;
    height: number;
    position: VectorLike;
    objectives: ObjectiveConfig[];
}

export enum AnnotationType {
    Text = "text"
}

export interface TextAnnotationData {
    type: AnnotationType.Text;
    text: string;
    x: number;
    y: number;
}

export type AnnotationData = TextAnnotationData;

export interface LevelData {
    index: number;
    width: number;
    height: number;
    time: number;
    modes: { [mode: string]: number };
    tiles: TileData[];
    goals: GoalData[];
    annotations: AnnotationData[];
}

export enum ObjectiveType {
    Position = "position",
    Velocity = "velocity",
    Speed = "speed",
    Momentum = "momentum",
    AngularVelocity = "angular-velocity"
}

export interface ObjectiveConfig {
    target: { minimum: number | VectorLike; maximum: number | VectorLike } | number;
    type: ObjectiveType;
    tiles: TileType[];
}

export class Objective {
    public minimum: number | VectorLike;
    public maximum: number | VectorLike;
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
        this.allowedTiles = config.tiles;
    }
}

export enum GoalType {
    Required,
    Bonus
}