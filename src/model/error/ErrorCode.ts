const enum ErrorCode {
    SubcommandError = -1,
    ArgumentError = 1,
    ConfigFileNotFoundError,
    InvalidConfigError,
    ExecutableNotFoundError,
    VersionNotFoundError
}

export default ErrorCode
