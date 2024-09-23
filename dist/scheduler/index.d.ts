import { Timing, TimeConstraint } from '../timing/contract.js';

type Mode = (ShotMode | LoopMode) & {
    _type: string;
};
type ShotMode = {
    _type: "shot";
};
type LoopMode = {
    _type: "loop";
    oneCycleTime: {
        h: number;
        m: number;
    };
};
declare class Scheduler {
    private readonly mode;
    private readonly timing;
    private readonly tasks;
    constructor(mode: Mode, timing: Timing, tasks: Task[]);
    run(): Promise<void>;
    private oneCycle;
    private loop;
}
type Task = {
    name: string;
    constraint: TimeConstraint;
    fn: () => Promise<void>;
};

export { Scheduler };
