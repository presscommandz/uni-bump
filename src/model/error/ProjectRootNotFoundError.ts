import ErrorCode from "./ErrorCode"
import CommandError from "./CommandError"

export default class ProjectRootNotFoundError extends CommandError {
    constructor(message = "Project root not found") {
        super(
            message,
            "ProjectRootNotFoundError",
            ErrorCode.ProjectRootNotFoundError
        )
    }
}
