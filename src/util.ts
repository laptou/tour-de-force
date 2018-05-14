import { Tween } from "@tweenjs/tween.js";

const { sqrt } = Math;

export function last<T>(arr: T[]): T | null {
    return arr.length > 0 ? arr[arr.length - 1] : null;
}

export function promise(anim: Tween): Promise<void> {
    return new Promise(resolve => anim.onComplete(resolve));
}

export function noop<T>(): Promise<T> {
    return new Promise(resolve => resolve());
}

export function inset(rect: Phaser.Geom.Rectangle, amount: number) {
    return rect.setTo(
        rect.left + amount,
        rect.top + amount,
        rect.width - amount * 2,
        rect.height - amount * 2);
}

export function square(n: number) {
    return n * n;
}

export function clamp(min: number, x: number, max: number) {
    return Math.min(Math.max(x, min), max);
}

export type VectorLike = { x: number; y: number };

// tslint:disable:no-use-before-declare
export class Vector {
    public static zero = new Vector(0, 0);

    public x: number;
    public y: number;

    public constructor(x: number, y: number);
    public constructor(x: VectorLike);
    public constructor(x: VectorLike | number, y?: number) {
        if (typeof x === "number") {
            this.x = x;
            this.y = y as number;
        } else {
            this.x = x.x;
            this.y = x.y;
        }
    }

    public length() { return vector.len(this); }
    public plus(v: VectorLike) { return vector.add(this, v); }
    public minus(v: VectorLike) { return vector.sub(this, v); }
    public times(v: number | VectorLike) { return vector.mult(this, v); }
    public dot(v: VectorLike) { return vector.dot(this, v); }
    public ray() { return new Ray(Vector.zero, this); }
}
// tslint:enable:no-use-before-declare

export namespace vector {
    export function lensq(v: VectorLike): number {
        return dot(v, v);
    }

    export function dot(a: VectorLike, b: VectorLike): number {
        return a.x * b.x + a.y * b.y;
    }

    export function len(v: VectorLike): number {
        return sqrt(lensq(v));
    }

    export function div(a: VectorLike, b: VectorLike | number): Vector {
        return new Vector(typeof b === "number" ? { x: a.x / b, y: a.y / b } : { x: a.x / b.x, y: a.y / b.y });
    }

    export function mult(a: VectorLike, b: VectorLike | number): Vector {
        return new Vector(typeof b === "number" ? { x: a.x * b, y: a.y * b } : { x: a.x * b.x, y: a.y * b.y });
    }

    export function sub(a: VectorLike, b: VectorLike): Vector {
        return new Vector(a.x - b.x, a.y - b.y);
    }

    export function add(a: VectorLike, b: VectorLike): Vector {
        return new Vector(a.x + b.x, a.y + b.y);
    }


    export function unit(v: VectorLike): Vector {
        const l = len(v);
        return new Vector(v.x / l, v.y / l);
    }
}

export class Ray {
    public source: VectorLike;
    public direction: VectorLike;

    public constructor(source: VectorLike, direction: VectorLike) {
        this.source = { x: source.x, y: source.y };
        this.direction = { x: direction.x, y: direction.y };
    }

    get x1() { return this.source.x; }
    get y1() { return this.source.y; }
    get x2() { return this.x1 + this.direction.x; }
    get y2() { return this.y1 + this.direction.y; }
    get end() { return vector.add(this.source, this.direction); };
    get length() { return vector.len(this.direction); }

    get angle() { return Math.atan2(this.direction.y, this.direction.x); }
    get unit() { return new Ray(this.source, vector.div(this.direction, this.length)); }


    public plus(x: number | VectorLike) {
        if (typeof x === "number")
            return new Ray(this.source, vector.add(this.direction, vector.unit(this.direction).times(x)));
        return new Ray(this.source, vector.add(this.direction, x));
    }

    public times(x: number | VectorLike) {
        return new Ray(this.source, vector.mult(this.direction, x));
    }
}



