import { Timing, TimeConstraint } from '../contract.js';

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

export { RedisTiming, withRedisTiming };
