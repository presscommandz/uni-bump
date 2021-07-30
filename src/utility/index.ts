import path from "path"
import { SemVer } from "semver"

export default class Utility {
    static omitFromArray<T>(list: T[], element: T): T[] {
        return list.filter(value => value != element)
    }

    // npm:walk-up-path
    static *walkUpPath(directory: string): Iterable<string> {
        for (directory = path.resolve(directory); path; ) {
            yield directory
            const parent = path.dirname(directory)
            if (parent === directory) directory = null
            else directory = parent
        }
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
