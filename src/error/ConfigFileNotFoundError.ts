import ErrorCode from "./ErrorCode"
import CommandError from "./CommandError"

export default class ConfigFileNotFoundError extends CommandError {
    constructor(message = "Config file not found") {
        super(
            message,
            "ConfigFileNotFoundError",
            ErrorCode.ConfigFileNotFoundError
        )
    }
}
