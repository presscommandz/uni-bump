import StatusCode from "@model/StatusCode"
import CommandError from "./CommandError"

export default class ArgumentError extends CommandError {
    constructor(message = "Argument error") {
        super(message, "ArgumentError", StatusCode.ArgumentError)
    }
}
