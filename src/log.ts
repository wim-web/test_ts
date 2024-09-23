import { createLogger, format, transports } from "winston";

export let logger = createLogger({
    transports: [
        new transports.Console({
            silent: true
        })
    ]
})

export const enableLog = (level: string) => {
    logger = createLogger({
        level,
        format: format.combine(
            format.timestamp(),
            format.json(),
        ),
        transports: [
            new transports.Console()
        ]
    })
}
