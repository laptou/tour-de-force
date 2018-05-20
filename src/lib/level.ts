import { VectorLike } from "@util/math";

export const enum GameMode {
    View = "view",
    Force = "force",
    Velocity = "velocity",
    Position = "position"
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
    objectives: ObjectiveData[];
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
    Type = "type",
    Velocity = "velocity",
    Momentum = "momentum",
    AngularVelocity = "angular-velocity"
}

export interface TypeObjectiveData {
    type: ObjectiveType.Type;
    target: TileType;
}

export interface ScalarObjectiveData {
    type: ObjectiveType.Momentum;
    target: { minimum?: number; maximum?: number } | number;
}

export interface VectorObjectiveData {
    type: ObjectiveType.Velocity | ObjectiveType.Momentum;
    target: { minimum?: VectorLike | number; maximum?: VectorLike | number } | VectorLike | number;
}

export type ObjectiveData = TypeObjectiveData | VectorObjectiveData;

export enum GoalType {
    Required,
    Bonus
}