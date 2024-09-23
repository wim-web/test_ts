import { T as Timing, a as TimeConstraint } from '../contract-DdJfrOyN.mjs';

declare class FileTiming implements Timing {
    private readonly filepath;
    private locker;
    constructor(filepath: string);
    private read;
    private flush;
    allow({ key, date, }: {
        key: string;
        date: Date;
    }): Promise<boolean>;
    complete({ key, constraint, date, }: {
        key: string;
        constraint: TimeConstraint;
        date: Date;
    }): Promise<void>;
}

type RedisTimingInput = {
    host: string;
    port: number;
    keyPrefix?: string;
};
declare const withRedisTiming: (input: RedisTimingInput, f: (timing: RedisTiming) => Promise<void>) => Promise<void>;
declare class RedisTiming implements Timing {
    private client;
    constructor({ host, port, keyPrefix }: RedisTimingInput);
    allow({ key, date, }: {
        key: string;
        date: Date;
    }): Promise<boolean>;
    complete({ key, constraint, date, }: {
        key: string;
        constraint: TimeConstraint;
        date: Date;
    }): Promise<void>;
    terminate(): Promise<void>;
}

type AtLeastOne<T, U = {
    [K in keyof T]: Pick<T, K>;
}> = Partial<T> & U[keyof U];

declare class Rate implements TimeConstraint {
    private readonly param;
    constructor(param: AtLeastOne<{
        h: number;
        m: number;
    }>);
    next(date: Date): Date;
}
declare class Daily implements TimeConstraint {
    private readonly param;
    constructor(param: {
        h: number;
        m: number;
    });
    next(date: Date): Date;
}

export { Daily, FileTiming, Rate, RedisTiming, TimeConstraint, Timing, withRedisTiming };
