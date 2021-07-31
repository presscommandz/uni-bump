import StatusCode from "@model/StatusCode"
import CommandError from "./CommandError"

export default class ExecutableNotFoundError extends CommandError {
    constructor(message: string) {
        super(
            message,
            "ExecutableNotFoundError",
            StatusCode.ExecutableNotFoundError
        )
    }
}
