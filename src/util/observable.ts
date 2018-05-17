interface IEventEmitter {
    emit(event: string | symbol, ...args: any[]): boolean;
    on(event: string | symbol, handler: Function, context?: any): this;
}

export function Observable<T extends IEventEmitter>(properties?: string[]) {
    return function (target: any) {
        if (!properties) {
            properties = [];

            for (const prop in target)
                if (target.hasOwnProperty(prop)) properties.push(prop);
        }

        for (const prop of properties) {
            Object.defineProperty(target, prop, {
                get: () => target[prop],
                set: value => {
                    target[prop] = value;

                    // tslint:disable-next-line:prefer-template
                    target.emit("update:" + prop, value);
                }
            })
        }

        return target;
    }
}