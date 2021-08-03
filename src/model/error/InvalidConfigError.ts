import StatusCode from "@model/StatusCode"
import CommandError from "./CommandError"

export default class InvalidConfigError extends CommandError {
    constructor(message = "Config file is not valid") {
        super(message, "InvalidConfigError", StatusCode.InvalidConfigError)
    }
}
