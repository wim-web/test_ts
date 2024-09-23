type SleepInput = {
    h?: number;
    m?: number;
    s?: number;
    ms?: number;
};
declare function calculateMilliseconds({ h, m, s, ms, }: SleepInput): number;

export { SleepInput, calculateMilliseconds };
