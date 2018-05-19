import { Tween } from "@tweenjs/tween.js";

const { sqrt, pow, PI } = Math;

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

export function reverseEnum(type: any) {
    for (const member in type) {
        if (type.hasOwnProperty(member)) {
            type[type[member]] = member;
        }
    }
}

export function find<T>(arr: T[], predicate: (value: T, index: number, arr: T[]) => boolean) {
    const index = arr.findIndex(predicate);
    if (index !== -1) return arr[index];
    else return null;
}