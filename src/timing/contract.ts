export interface Timing {
    allow: (input: {
        key: string,
        date: Date,
    }) => Promise<boolean>;
    complete: (input: {
        key: string,
        constraint: TimeConstraint,
        date: Date,
    }) => Promise<void>;
}

export interface TimeConstraint {
    next(date: Date): Date;
}
