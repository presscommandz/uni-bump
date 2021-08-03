import StatusCode from "@model/StatusCode"
import CommandError from "./CommandError"

export default class SubcommandError extends CommandError {
    constructor(message = "Run bump version command failed") {
        super(message, "SubcommandError", StatusCode.SubcommandError)
    }
}
