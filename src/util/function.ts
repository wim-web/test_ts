export type SleepInput = {
    h?: number,
    m?: number,
    s?: number,
    ms?: number,
}

export function calculateMilliseconds({
    h, m, s, ms,
}: SleepInput): number {
    const toM = (h: number) => h * 60
    const toS = (m: number) => m * 60
    const toMS = (s: number) => s * 1000

    return toMS(
        toS(
            toM(
                h || 0
            ) + (m || 0)
        ) + (s || 0)
    ) + (ms || 0)
}

