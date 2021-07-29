import ErrorCode from "./ErrorCode"
import CommandError from "./CommandError"

export default class ExecutableNotFoundError extends CommandError {
    constructor(message: string) {
        super(
            message,
            "ExecutableNotFoundError",
            ErrorCode.ExecutableNotFoundError
        )
    }
}
