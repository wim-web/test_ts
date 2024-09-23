import { TimeConstraint, Timing } from "@/timing/contract";
import { Redis } from "ioredis";

type RedisTimingInput = {
    host: string, port: number, keyPrefix?: string
}

export const withRedisTiming = async (input: RedisTimingInput, f: (timing: RedisTiming) => Promise<void>) => {
    const timing = new RedisTiming(input)

    try {
        await f(timing)
    } finally {
        await timing.terminate()
    }
}

export class RedisTiming implements Timing {
    private client

    constructor({ host, port, keyPrefix }: RedisTimingInput) {
        this.client = new Redis({
            host,
            port,
            keyPrefix
        })
    }

    async allow({
        key,
        date,
    }: { key: string, date: Date; }) {
        // TTLで勝手に消えるのでkeyで取得できたらfalse, なかったらtrue
        const result = await this.client.exists(key)
        return result === 0
    }

    async complete({
        key,
        constraint,
        date,
    }: { key: string, constraint: TimeConstraint, date: Date; }) {
        const next = constraint.next(date).getTime()
        const ttl = Math.floor((next - date.getTime()) / 1000); // TTLを秒単位で計算

        // nextまでの時間をTTLとしてredisに保存する
        // keyはkeyでvalueはなくてもいい
        if (ttl > 0) {
            await this.client.set(key, '', 'EX', ttl); // TTLを設定してキーを保存
        }
    }

    async terminate() {
        await this.client.quit()
    }
}
