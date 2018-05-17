import { GameMode } from "@lib/level";
import { Tile } from "@scene/level/tile";
import { Observable } from "@util/observable";
import { EventEmitter } from "events";

@Observable()
export class LevelState extends EventEmitter {
    public target: Tile | null = null;
    public track: Tile | null = null;
    public mode: GameMode = GameMode.Force;

}