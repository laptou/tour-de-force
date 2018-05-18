import { GameMode, LevelData } from "@lib/level";
import { Goal } from "@scene/level/goal";
import { Tile } from "@scene/level/tile";
import { Observable } from "@util/observable";
import { EventEmitter } from "events";

@Observable()
export class LevelState extends EventEmitter {
    public goals: Goal[] = [];
    public tiles: Tile[] = [];
    public level: LevelData | null = null;
    public target: Tile | null = null;
    public track: Tile | null = null;
    public mode: GameMode = GameMode.Force;
    public modes: { [mode: string]: number; } = {};
}