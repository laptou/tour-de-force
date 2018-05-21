interface IEventEmitter {
    emit(event: string | symbol, ...args: any[]): boolean;
    on(event: string | symbol, handler: Function, context?: any): this;
}

export function observable<T extends IEventEmitter>(target: any, prop: string | symbol) {
    if (!("__shadow" in target))
        target["__shadow"] = {};

    Object.defineProperty(target, prop, {
        get: () => "__shadow" in target ? target.__shadow[prop] : target[prop],
        set: value => {
            if (target.__shadow[prop] === value)
                return;

            target.__shadow[prop] = value;

            // tslint:disable-next-line:prefer-template
            target.emit("update:" + prop.toString(), value);
        }
    })
}