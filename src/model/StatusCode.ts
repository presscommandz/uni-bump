const enum StatusCode {
    SubcommandError = -1,
    ExitSuccess = 0,
    ArgumentError = 1,
    ConfigFileNotFoundError,
    InvalidConfigError,
    ExecutableNotFoundError,
    VersionNotFoundError
}

export default StatusCode
