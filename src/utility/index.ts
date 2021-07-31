import { SemVer } from "semver"

export default class Utility {
    static omitFromArray<T>(list: T[], element: T): T[] {
        return list.filter(value => value != element)
    }

    static getVersionString(version: SemVer): string {
        let versionString = [version.major, version.minor, version.patch].join(
            "."
        )
        if (version.prerelease.length > 0) {
            versionString = [versionString, ...version.prerelease].join("-")
        }
        if (version.build.length > 0) {
            versionString = [versionString, ...version.build].join("+")
        }
        return versionString
    }
}
