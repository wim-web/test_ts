
import { TimeConstraint } from "@/timing/contract"
import { AtLeastOne } from "@/util/types"

export class Rate implements TimeConstraint {
    constructor(private readonly param: AtLeastOne<{
        h: number,
        m: number,
    }>) { }

    next(date: Date): Date {
        const h_ms = (this.param.h || 0) * 60 * 60 * 1000
        const m_ms = (this.param.m || 0) * 60 * 1000
        const timestamp = date.getTime()

        return new Date(timestamp + h_ms + m_ms)
    }
}

export class Daily implements TimeConstraint {
    constructor(private readonly param: {
        h: number,
        m: number,
    }) { }

    next(date: Date): Date {
        const base = new Date(
            Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), this.param.h, this.param.m)
        )

        return date <= base
            ? base
            : (() => {
                base.setDate(base.getDate() + 1)
                return base
            })()
    }
}
