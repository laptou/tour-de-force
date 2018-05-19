import { GameMode, LevelData } from "@lib/level";
import { Goal } from "@scene/level/goal";
import { Tile } from "@scene/level/tile";
import { observable } from "@util/observable";
import { EventEmitter } from "events";


export class LevelState extends EventEmitter {
    @observable public goals: Goal[] = [];
    @observable public tiles: Tile[] = [];
    @observable public level: LevelData | null = null;
    @observable public target: Tile | null = null;
    @observable public track: Tile | null = null;
    @observable public mode: GameMode = GameMode.Force;
    @observable public completed = false;

    public get modes() { return this.level ? this.level.modes : null; }
}