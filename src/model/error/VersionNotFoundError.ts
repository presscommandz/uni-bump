import StatusCode from "@model/StatusCode"
import CommandError from "./CommandError"

export default class VersionNotFoundError extends CommandError {
    constructor(message = "Cannot find project version") {
        super(message, "VersionNotFoundError", StatusCode.VersionNotFoundError)
    }
}
