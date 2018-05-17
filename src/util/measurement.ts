import { reverseEnum } from "@util/index.ts";

import { fixed, precision } from "./format";
import { Vector, VectorLike } from "./math";

const { PI } = Math;

type Numeric = VectorMeasurement | Measurement | VectorLike | number;
type Scalar = Measurement | number;

export function abs(x: number): number;
export function abs(x: Measurement): Measurement;
export function abs(x: Scalar): Scalar;
export function abs(x: Scalar): Scalar {
    if (typeof x === "number") return Math.abs(x);
    else return new Measurement(Math.abs(x.value), x.unit);
}

export enum Distance {
    Pixel = "px",
    Meter = "m"
}

export enum Time {
    Second = "s",
    Step = "step"
}

export enum Force {
    Newton = "N"
}

export enum Mass {
    Kilogram = "kg"
}

export enum Angle {
    Degree = "°",
    Radian = "rad"
}

reverseEnum(Distance);
reverseEnum(Time);
reverseEnum(Force);
reverseEnum(Mass);
reverseEnum(Angle);

export type BaseUnit = Distance | Time | Force | Mass | Angle;

export class Unit {
    public static scalar = new Unit([]);

    public numerator: BaseUnit[];
    public denominator: BaseUnit[];

    constructor(num: BaseUnit[] | BaseUnit, den?: BaseUnit[] | BaseUnit) {
        this.numerator = typeof num === "string" ? [num] : num.sort();
        this.denominator = typeof den === "string" ? [den] : (den ? den.sort() : []);
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

    public times(other: Unit) { return Unit.mult(this, other); }

    public over(other: Unit) { return Unit.div(this, other); }

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

export namespace Force {
    export const PixelNewton = new Unit(
        [Mass.Kilogram, Distance.Pixel],
        [Time.Second, Time.Second]);
}

export namespace Velocity {
    export const PixelsPerStep = new Unit(Distance.Pixel, Time.Step);
    export const MetersPerSecond = new Unit(Distance.Meter, Time.Second);
}

export namespace AngularVelocity {
    export const DegreesPerStep = new Unit(Angle.Degree, Time.Step);
    export const DegreesPerSecond = new Unit(Angle.Degree, Time.Second);
    export const RadiansPerStep = new Unit(Angle.Radian, Time.Step);
    export const RadiansPerSecond = new Unit(Angle.Radian, Time.Second);
}

export namespace convert {
    export function angle(value: number, from: Angle, to: Angle) {
        if (from === to) return value;

        // base unit is radians

        switch (from) {
            case Angle.Degree:
                value = value / 180 * PI;
                break;
        }

        switch (to) {
            case Angle.Degree:
                return value * 180 / PI;
            case Angle.Radian:
                return value;
        }
    }

    export function distance(value: number, from: Distance, to: Distance) {
        if (from === to) return value;

        // base unit is meters

        switch (from) {
            case Distance.Pixel:
                value = value / 100;
                break;
        }

        switch (to) {
            case Distance.Pixel:
                return value * 100;
            case Distance.Meter:
                return value;
        }
    }

    export function time(value: number, from: Time, to: Time) {
        if (from === to) return value;

        // base unit is seconds

        switch (from) {
            case Time.Step:
                value = value / 60;
                break;
        }

        switch (to) {
            case Time.Step:
                return value * 60;
            case Time.Second:
                return value;
        }
    }

    export function auto<T extends BaseUnit>(value: number, from: T, to: T) {
        if (!possible(from, to)) throw new Error(`Incompatible units: ${from}, ${to}`);

        if (from === to) return value;

        if (from in Angle) return angle(value, from as Angle, to as Angle);
        if (from in Distance) return distance(value, from as Distance, to as Distance);
        if (from in Time) return time(value, from as Time, to as Time);

        return value;
    }

    export function possible<T extends BaseUnit>(from: T, to: T) {
        if (from === to) return true;
        if (from in Angle && to in Angle) return true;
        if (from in Distance && to in Distance) return true;
        if (from in Time && to in Time) return true;
        return false;
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

    public toString(radix?: number): string {
        // tslint:disable-next-line:prefer-template
        return `${this.value.toString(radix)} ${this.unit}`;
    }

    public toFixed(fractionDigits?: number): string {
        // tslint:disable-next-line:prefer-template
        return `${this.value.toFixed(fractionDigits)} ${this.unit}`;
    }

    public toExponential(fractionDigits?: number): string {
        // tslint:disable-next-line:prefer-template
        return `${this.value.toExponential(fractionDigits)} ${this.unit}`;
    }

    // tslint:disable-next-line:no-shadowed-variable
    public toPrecision(precision?: number): string {
        // tslint:disable-next-line:prefer-template
        return `${this.value.toPrecision(precision)} ${this.unit}`;
    }

    public valueOf(): number {
        return this.value;
    }
    public toLocaleString(locales?: string | string[], options?: Intl.NumberFormatOptions): string {
        throw new Error("Method not implemented.");
    }

    public times(m: Scalar) {
        if (typeof m === "number")
            return new Measurement(this.value * m, this.unit);

        return new Measurement(this.value * m.value, Unit.mult(this.unit, m.unit));
    }

    public over(m: Scalar) {
        if (typeof m === "number")
            return new Measurement(this.value * m, this.unit);

        return new Measurement(this.value / m.value, Unit.div(this.unit, m.unit));
    }

    public to(target: Unit): Measurement;
    public to(numerator: BaseUnit, denominator?: BaseUnit): Measurement;
    public to(target: Unit | BaseUnit, denominator?: BaseUnit) {
        let val = this.value;
        const unit = this.unit.expanded();
        const num = [...unit.numerator];
        const den = [...unit.denominator];


        if (!(target instanceof Unit)) target = new Unit(target, denominator);

        const targetExpanded = target.expanded();
        const targetNum = [...targetExpanded.numerator];
        const targetDen = [...targetExpanded.denominator];

        for (const numUnit of num) {
            const i = targetNum.findIndex(n => convert.possible(n, numUnit));
            const [targetNumUnit] = targetNum.splice(i, 1);

            val = convert.auto(val, numUnit, targetNumUnit);
        }

        for (const denUnit of den) {
            const i = targetDen.findIndex(d => convert.possible(d, denUnit));
            const [targetDenUnit] = targetDen.splice(i, 1);

            val = 1 / convert.auto(1 / val, denUnit, targetDenUnit);
        }

        return new Measurement(val, target);
    }
}

export class VectorMeasurement extends Vector {
    public static zero = new VectorMeasurement(0, 0, Unit.scalar);
    public unit: Unit;

    public constructor(x: VectorLike, u: Unit | BaseUnit);
    public constructor(x: number, y: number, u: Unit | BaseUnit);
    public constructor(x: number | VectorLike, y: number | Unit | BaseUnit, u?: Unit | BaseUnit) {
        if (u) {
            super(x as number, y as number);
            this.unit = u instanceof Unit ? u : new Unit(u);
        } else {
            super(x as Vector);
            this.unit = y instanceof Unit ? y : new Unit(y as BaseUnit);
        }
    }

    public toString() {
        return `⟨${this.x}, ${this.y}⟩ ${this.unit}`;
    }

    public toFixed(p?: number) {
        return fixed(p) `⟨${this.x}, ${this.y}⟩ ` + this.unit.toString();
    }

    public toPrecision(p?: number) {
        return precision(p) `⟨${this.x}, ${this.y}⟩ ` + this.unit.toString();
    }

    public toExponential(p?: number) {
        return `⟨${this.x.toExponential(p)}, ${this.y.toExponential(p)}⟩ ${this.unit}`;
    }

    public to(target: Unit): VectorMeasurement;
    public to(numerator: BaseUnit, denominator?: BaseUnit): VectorMeasurement;
    public to(target: Unit | BaseUnit, denominator?: BaseUnit) {
        let unit: Unit;

        if (target instanceof Unit) unit = target;
        else {
            if (denominator)
                unit = new Unit([target], [denominator]);
            else
                unit = new Unit([target]);
        }

        const xm = new Measurement(this.x, this.unit).to(unit);
        const ym = new Measurement(this.y, this.unit).to(unit);

        return new VectorMeasurement(xm.value, ym.value, unit);
    }

    public magnitude() {
        return new Measurement(super.length(), this.unit);
    }

    public times(v: Numeric) {
        if (v instanceof Measurement)
            return new VectorMeasurement(super.times(v.value), this.unit.times(v.unit));
        if (v instanceof VectorMeasurement)
            return new VectorMeasurement(super.times(v), this.unit.times(v.unit));

        return new VectorMeasurement(super.times(v), this.unit);
    }

    public over(v: Numeric) {
        if (v instanceof Measurement)
            return new VectorMeasurement(super.over(v.value), this.unit.over(v.unit));
        if (v instanceof VectorMeasurement)
            return new VectorMeasurement(super.over(v), this.unit.over(v.unit));

        return new VectorMeasurement(super.over(v), this.unit);
    }
}