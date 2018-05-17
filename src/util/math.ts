import { Measurement, VectorMeasurement } from "./measurement";

const { pow, sqrt, hypot } = Math;

export function square(n: number) {
    return n * n;
}

export function clamp(min: number, x: number, max: number) {
    return Math.min(Math.max(x, min), max);
}

export function abs(x: number): number;
export function abs(x: Measurement): Measurement;
export function abs(x: number | Measurement): number | Measurement;
export function abs(x: number | Measurement): number | Measurement {
    if (typeof x === "number") return Math.abs(x);
    else return new Measurement(Math.abs(x.value), x.unit);
}

type Numeric = (number | Vector | Measurement | VectorMeasurement);

export function precision(p?: number) {
    return (tags: TemplateStringsArray, ...keys: Numeric[]) => {
        let str = tags[0];
        for (let i = 1; i < tags.length; i++) {
            str += keys[i - 1].toPrecision(p);
            str += tags[i];
        }

        return str;
    }
}

export function fixed(p?: number) {
    return (tags: TemplateStringsArray, ...keys: Numeric[]) => {
        let str = tags[0];
        for (let i = 1; i < tags.length; i++) {
            let num = keys[i - 1];

            if (!(num instanceof Vector) && typeof p === "number" && abs(num).valueOf() < pow(10, -p))
                num = abs(num); // fixes -0.0

            str += num.toFixed(p);
            str += tags[i];
        }

        return str;
    }
}

export type VectorLike = { x: number; y: number };

// tslint:disable:no-use-before-declare
export class Vector {
    public static zero = new Vector(0, 0);

    public static lensq(v: VectorLike): number {
        return Vector.dot(v, v);
    }

    public static dot(a: VectorLike, b: VectorLike): number {
        return a.x * b.x + a.y * b.y;
    }

    public static len(v: VectorLike): number {
        return hypot(v.x, v.y);
    }

    public static div(a: VectorLike, b: VectorLike | number): Vector {
        return new Vector(typeof b === "number" ? { x: a.x / b, y: a.y / b } : { x: a.x / b.x, y: a.y / b.y });
    }

    public static mult(a: VectorLike, b: VectorLike | number): Vector {
        return new Vector(typeof b === "number" ? { x: a.x * b, y: a.y * b } : { x: a.x * b.x, y: a.y * b.y });
    }

    public static sub(a: VectorLike, b: VectorLike): Vector {
        return new Vector(a.x - b.x, a.y - b.y);
    }

    public static add(a: VectorLike, b: VectorLike): Vector {
        return new Vector(a.x + b.x, a.y + b.y);
    }


    public static unit(v: VectorLike): Vector {
        const l = Vector.len(v);
        return new Vector(v.x / l, v.y / l);
    }

    public x: number;
    public y: number;

    public constructor(x: number, y: number);
    public constructor(x: VectorLike);
    public constructor(x: VectorLike | number, y?: number) {
        if (typeof x === "number") {
            this.x = x;
            this.y = typeof y === "number" ? y : x;
        } else {
            this.x = x.x;
            this.y = x.y;
        }
    }

    public length() { return Vector.len(this); }
    public plus(v: VectorLike) { return Vector.add(this, v); }
    public minus(v: VectorLike) { return Vector.sub(this, v); }
    public times(v: number | VectorLike) { return Vector.mult(this, v); }
    public over(v: number | VectorLike) { return Vector.div(this, v); }
    public dot(v: VectorLike) { return Vector.dot(this, v); }
    public ray() { return new Ray(Vector.zero, this); }

    public toString() { return `⟨${this.x}, ${this.y}⟩`; }
    public toFixed(p?: number) { return `⟨${this.x.toFixed(p)}, ${this.y.toFixed(p)}⟩`; }
    public toPrecision(p?: number) { return `⟨${this.x.toPrecision(p)}, ${this.y.toPrecision(p)}⟩`; }
    public toExponential(p?: number) { return `⟨${this.x.toExponential(p)}, ${this.y.toExponential(p)}⟩`; }


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
    get end() { return Vector.add(this.source, this.direction); };
    get length() { return Vector.len(this.direction); }

    get angle() { return Math.atan2(this.direction.y, this.direction.x); }
    get unit() { return new Ray(this.source, Vector.div(this.direction, this.length)); }


    public plus(x: number | VectorLike) {
        if (typeof x === "number")
            return new Ray(this.source, Vector.add(this.direction, Vector.unit(this.direction).times(x)));
        return new Ray(this.source, Vector.add(this.direction, x));
    }

    public times(x: number | VectorLike) {
        return new Ray(this.source, Vector.mult(this.direction, x));
    }
}



