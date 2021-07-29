export default class CommandError extends Error {
    readonly errorCode: number

    constructor(message?: string, name?: string, errorCode?: number) {
        super(message)
        this.name = name
        this.errorCode = errorCode
    }
}
