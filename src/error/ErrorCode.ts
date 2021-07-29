const enum ErrorCode {
    SubcommandError = -1,
    ConfigFileNotFoundError = 1,
    InvalidConfigError = 2,
    ExecutableNotFoundError = 3,
    ProjectRootNotFoundError = 4
}

export default ErrorCode
