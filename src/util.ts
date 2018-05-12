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

export type Vector = { x: number; y: number };

export type Ray = { source: Vector; direction: Vector };

export function vsquare(a: Vector) {
    const l = vlen(a);
    return l * l;
}

export function vdot(a: Vector, b: Vector) {
    return a.x * b.x + a.y * b.y;
}

export function vlen(a: Vector) {
    return sqrt(a.x * a.x + a.y * a.y);
}

export function vdiv(a: Vector, b: Vector | number) {
    return typeof b === "number" ? { x: a.x / b, y: a.y / b } : { x: a.x / b.x, y: a.y / b.y };
}