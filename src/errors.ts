const enum ErrorCode {
    ConfigFileNotFoundError = 1,
    InvalidConfigError = 2,
    ExecutableNotFoundError = 3
}

export class RunCommandError extends Error {
    readonly errorCode: number

    constructor(message?: string, name?: string, errorCode?: number) {
        super(message)
        this.name = name
        this.errorCode = errorCode
    }
}

export class ConfigFileNotFoundError extends RunCommandError {
    constructor(message = "Config file not found") {
        super(
            message,
            "ConfigFileNotFoundError",
            ErrorCode.ConfigFileNotFoundError
        )
    }
}

export class InvalidConfigError extends RunCommandError {
    constructor(message = "Config file is not valid") {
        super(message, "InvalidConfigError", ErrorCode.InvalidConfigError)
    }
}

export class ExecutableNotFoundError extends RunCommandError {
    constructor(message) {
        super(
            message,
            "ExecutableNotFoundError",
            ErrorCode.ExecutableNotFoundError
        )
    }
}
