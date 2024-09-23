import { TimeConstraint, Timing } from "../contract";
import fs from 'fs';
import * as path from 'path';

type Locker = {
    [key: string]: string // 本当はvalueはdateだが、全部parseしてdateにするのは非効率なのでstringで保持する
}

export class FileTiming implements Timing {
    private locker: Locker = {}

    constructor(private readonly filepath: string) {
        const dir = path.dirname(this.filepath);

        // ディレクトリが存在しない場合は作成
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        // ファイルが存在しない場合は作成
        if (!fs.existsSync(this.filepath)) {
            this.flush()
            return
        }

        this.read()
    }

    private read() {
        this.locker = JSON.parse(fs.readFileSync(this.filepath, 'utf-8'))
    }

    private flush() {
        fs.writeFileSync(this.filepath, JSON.stringify(this.locker), 'utf-8')
    }

    async allow({
        key,
        date,
    }: {
        key: string,
        date: Date,
    }) {
        if (this.locker[key] === undefined) {
            return true
        }

        const nextTime = new Date(this.locker[key])

        return date >= nextTime
    }

    async complete({
        key,
        constraint,
        date,
    }: {
        key: string,
        constraint: TimeConstraint,
        date: Date,
    }) {
        this.locker[key] = constraint.next(date).toISOString()
        this.flush()
    }
}

