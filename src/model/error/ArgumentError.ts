import ErrorCode from "./ErrorCode"
import CommandError from "./CommandError"

export default class ArgumentError extends CommandError {
    constructor(message = "Argument error") {
        super(message, "ArgumentError", ErrorCode.ArgumentError)
    }
}
