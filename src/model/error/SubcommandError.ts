import ErrorCode from "./ErrorCode"
import CommandError from "./CommandError"

export default class SubcommandError extends CommandError {
    constructor(message = "Run bump version command failed") {
        super(message, "SubcommandError", ErrorCode.SubcommandError)
    }
}
