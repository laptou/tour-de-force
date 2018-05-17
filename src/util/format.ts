import { Vector } from "./math";
import { abs, Measurement, VectorMeasurement } from "./measurement";

const { pow } = Math;

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