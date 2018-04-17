export function last<T>(arr: T[]): T
{
    return arr.length > 0 ? arr[arr.length - 1] : null;
}