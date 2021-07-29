import ErrorCode from "./ErrorCode"

export class BumpVersionError extends Error {
    readonly errorCode: number

    constructor(message?: string, name?: string, errorCode?: number) {
        super(message)
        this.name = name
        this.errorCode = errorCode
    }
}

export class ConfigFileNotFoundError extends BumpVersionError {
    constructor(message = "Config file not found") {
        super(
            message,
            "ConfigFileNotFoundError",
            ErrorCode.ConfigFileNotFoundError
        )
    }
}

export class InvalidConfigError extends BumpVersionError {
    constructor(message = "Config file is not valid") {
        super(message, "InvalidConfigError", ErrorCode.InvalidConfigError)
    }
}

export class ExecutableNotFoundError extends BumpVersionError {
    constructor(message: string) {
        super(
            message,
            "ExecutableNotFoundError",
            ErrorCode.ExecutableNotFoundError
        )
    }
}

export class SubcommandError extends BumpVersionError {
    constructor(message = "Run bump version command failed") {
        super(message, "SubcommandError", ErrorCode.SubcommandError)
    }
}
