import { TimeConstraint } from '../contract.js';
import { AtLeastOne } from '../../util/types.js';

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

export { Daily, Rate };
