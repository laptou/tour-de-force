import { Tween } from "@tweenjs/tween.js";

const { sqrt, pow } = Math;

export function abs(x: number): number;
export function abs(x: units.Measurement): units.Measurement;
export function abs(x: number | units.Measurement): number | units.Measurement;
export function abs(x: number | units.Measurement): number | units.Measurement {
    if (typeof x === "number") return Math.abs(x);
    else return new units.Measurement(Math.abs(x.value), x.unit);
}

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

export function precision(p?: number) {
    return (tags: TemplateStringsArray, ...keys: (number | Vector | units.Measurement)[]) => {
        let str = tags[0];
        for (let i = 1; i < tags.length; i++) {
            str += keys[i - 1].toPrecision(p);
            str += tags[i];
        }

        return str;
    }
}

export function fixed(p?: number) {
    return (tags: TemplateStringsArray, ...keys: (number | Vector | units.Measurement)[]) => {
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

    public length() { return vector.len(this); }
    public plus(v: VectorLike) { return vector.add(this, v); }
    public minus(v: VectorLike) { return vector.sub(this, v); }
    public times(v: number | VectorLike) { return vector.mult(this, v); }
    public dot(v: VectorLike) { return vector.dot(this, v); }
    public ray() { return new Ray(Vector.zero, this); }

    public toString() { return `<${this.x}, ${this.y}>`; }
    public toFixed(p?: number) { return `<${this.x.toFixed(p)}, ${this.y.toFixed(p)}>`; }
    public toPrecision(p?: number) { return `<${this.x.toPrecision(p)}, ${this.y.toPrecision(p)}>`; }
    public toExponential(p?: number) { return `<${this.x.toExponential(p)}, ${this.y.toExponential(p)}>`; }
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

export namespace units {
    export enum Distance {
        Pixel = "px",
        Meter = "m"
    }

    export enum Time {
        Second = "s"
    }

    export enum Force {
        Newton = "N"
    }

    export enum Mass {
        Kilogram = "kg"
    }

    type BaseUnit = Distance | Time | Force | Mass;

    export class Unit {
        public numerator: BaseUnit[];
        public denominator: BaseUnit[];

        constructor(num: BaseUnit[], den?: BaseUnit[]) {
            this.numerator = num.sort();
            this.denominator = den ? den.sort() : [];
        }

        public expanded() {
            const [num, den] = [[...this.numerator], [...this.denominator]];

            const expand = (n: BaseUnit[], d: BaseUnit[]) => {
                for (const u of [...n]) {
                    let ni = n.indexOf(u);

                    if (ni === -1) continue;

                    switch (u) {
                        case Force.Newton:
                            n.splice(ni, 1, Mass.Kilogram, Distance.Meter);
                            d.push(Time.Second, Time.Second);
                            break;
                    }
                }
            };

            expand(num, den);
            expand(den, num);

            return new Unit(num, den);
        }

        public simplified() {
            const [num, den] = [[...this.numerator], [...this.denominator]];

            for (const u of [...num, ...den]) {
                let ni = num.indexOf(u);
                let di = den.indexOf(u);

                while (ni !== -1 && di !== -1) {
                    num.splice(ni, 1);
                    den.splice(di, 1);

                    ni = num.indexOf(u);
                    di = den.indexOf(u);
                }
            }

            const simplify = (n: BaseUnit[], d: BaseUnit[]) => {
                let found = false;

                do {
                    found = false;

                    if (n.indexOf(Mass.Kilogram) !== -1 &&
                        n.indexOf(Distance.Meter) !== -1 &&
                        d.indexOf(Time.Second) !== -1 &&
                        d.indexOf(Time.Second) !== d.lastIndexOf(Time.Second)) {
                        n.splice(n.indexOf(Mass.Kilogram), 1);
                        n.splice(n.indexOf(Distance.Meter), 1);
                        d.splice(n.indexOf(Time.Second), 1);
                        d.splice(n.indexOf(Time.Second), 1);
                        n.push(Force.Newton);
                        found = true;
                    }
                } while (found);
            };

            simplify(num, den);
            simplify(den, num);

            return new Unit(num, den);
        }

        public toString() {
            let str = "";

            for (let ni = 0; ni < this.numerator.length; ni++) {
                if (ni > 0) {
                    if (this.numerator[ni] === this.numerator[ni - 1]) {
                        str += "²";
                        continue;
                    }

                    str += " × ";
                }

                str += this.numerator[ni];
            }

            for (let di = 0; di < this.denominator.length; di++) {
                if (di > 0 && this.denominator[di] === this.denominator[di - 1]) {
                    str += "²";
                    continue;
                }

                str += " / ";
                str += this.denominator[di];
            }

            return str;
        }

        public static mult(u1: Unit, u2: Unit) {
            u1 = u1.expanded();
            u2 = u2.expanded();

            return new Unit(
                [...u1.numerator, ...u2.numerator],
                [...u1.denominator, ...u2.denominator])
                .simplified();
        }

        public static div(u1: Unit, u2: Unit) {
            u1 = u1.expanded();
            u2 = u2.expanded();

            return new Unit(
                [...u1.numerator, ...u2.denominator],
                [...u1.denominator, ...u2.numerator])
                .simplified();
        }
    }

    export class Measurement implements Number {
        public value: number;
        public unit: Unit;

        // tslint:disable-next-line:no-shadowed-variable
        constructor(value: number, unit: Unit | BaseUnit) {
            this.value = value;
            this.unit = unit instanceof Unit ? unit : new Unit([unit]);
        }

        public toString(radix?: number | undefined): string {
            // tslint:disable-next-line:prefer-template
            return `${this.value.toString(radix)} ${this.unit}`;
        }

        public toFixed(fractionDigits?: number | undefined): string {
            // tslint:disable-next-line:prefer-template
            return `${this.value.toFixed(fractionDigits)} ${this.unit}`;
        }

        public toExponential(fractionDigits?: number | undefined): string {
            // tslint:disable-next-line:prefer-template
            return `${this.value.toExponential(fractionDigits)} ${this.unit}`;
        }

        // tslint:disable-next-line:no-shadowed-variable
        public toPrecision(precision?: number | undefined): string {
            // tslint:disable-next-line:prefer-template
            return `${this.value.toPrecision(precision)} ${this.unit}`;
        }

        public valueOf(): number {
            return this.value;
        }
        public toLocaleString(locales?: string | string[] | undefined, options?: Intl.NumberFormatOptions | undefined): string {
            throw new Error("Method not implemented.");
        }

        public times(m: Measurement | number) {
            if (typeof m === "number")
                return new Measurement(this.value * m, this.unit);

            return new Measurement(this.value * m.value, Unit.mult(this.unit, m.unit));
        }

        public over(m: Measurement | number) {
            if (typeof m === "number")
                return new Measurement(this.value * m, this.unit);

            return new Measurement(this.value / m.value, Unit.div(this.unit, m.unit));
        }
    }

    export class VectorMeasurement extends Vector {
        public unit: Unit;

        public constructor(x: VectorLike, u: Unit);
        public constructor(x: number, y: number, u: Unit);
        public constructor(x: number | VectorLike, y: number | Unit, u?: Unit) {
            if (u) {
                super(x as number, y as number);
                this.unit = u;
            } else {
                super(x as Vector);
                this.unit = y as Unit;
            }
        }

        public toString() {
            return `<${this.x}, ${this.y}> ${this.unit}`;
        }

        public toFixed(p?: number) {
            return fixed(p) `<${this.x}, ${this.y}> ` + this.unit.toString();
        }

        public toPrecision(p?: number) {
            return precision(p) `<${this.x}, ${this.y}> ` + this.unit.toString();
        }

        public toExponential(p?: number) {
            return `<${this.x.toExponential(p)}, ${this.y.toExponential(p)}> ${this.unit}`;
        }
    }
}



