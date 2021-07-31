const enum VersionType {
    major = "major",
    minor = "minor",
    patch = "patch",
    build = "build"
}

export default VersionType

export const VersionTypeArray: string[] = [
    VersionType.major,
    VersionType.minor,
    VersionType.patch,
    VersionType.build
]
export const MainVersionTypeArray = [
    VersionType.major,
    VersionType.minor,
    VersionType.patch
]
