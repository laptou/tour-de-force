const { pow, sqrt, hypot } = Math;

export function square(n: number) {
    return n * n;
}

export function clamp(min: number, x: number, max: number) {
    return Math.min(Math.max(x, min), max);
}

export interface VectorLike { x: number; y: number }


// tslint:disable:no-use-before-declare
export class Vector {

    public static get zero() { return new Vector(0, 0); }

    /**
     * Returns a < b.
     */
    public static lt(a: number | VectorLike, b: VectorLike): boolean {
        if (typeof a === "number") return a < Vector.len(b);

        return a.x < b.x && a.y < b.y;
    }

    /**
     * Returns a > b.
     */
    public static gt(a: number | VectorLike, b: VectorLike): boolean {
        if (typeof a === "number") return a > Vector.len(b);

        return a.x > b.x && a.y > b.y;
    }

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

    public static normalize(v: VectorLike): Vector {
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
    public normalized() { return Vector.normalize(this); }

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
            return new Ray(this.source, Vector.add(this.direction, Vector.normalize(this.direction).times(x)));
        return new Ray(this.source, Vector.add(this.direction, x));
    }

    public times(x: number | VectorLike) {
        return new Ray(this.source, Vector.mult(this.direction, x));
    }
}

export interface SizeLike { width: number; height: number; }

export class Size {
    public width: number;
    public height: number;

    public static from(v: VectorLike) {
        return new Size(v.x, v.y);
    }

    public constructor(size: SizeLike);
    public constructor(dimension: number);
    public constructor(width: number, height: number);
    public constructor(width: number | SizeLike, height?: number) {
        if (typeof width === "number") {
            this.width = width;
            this.height = typeof height === "number" ? height : width;
        } else {
            this.width = width.width;
            this.height = width.height;
        }
    }


}

