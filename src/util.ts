import { Tween } from "@tweenjs/tween.js";

export function last<T>(arr: T[]): T | null
{
    return arr.length > 0 ? arr[arr.length - 1] : null;
}

export function promise(anim: Tween): Promise<void>
{
    return new Promise(resolve => anim.onComplete(resolve));
}

export function noop<T>(): Promise<T>
{
    return new Promise(resolve => resolve());
}