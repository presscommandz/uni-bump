import semver, { SemVer } from "semver"
import * as buildNumGen from "build-number-generator"

export default class SemVerHandler {
    static SemverMainType = ["major", "minor", "patch"]
    /**
     *  Increase (if `value` type is boolean) or set version
     */
    static bumpVersion(
        version: SemVer,
        type: "major" | "minor" | "patch" | "build",
        value: string | number | boolean
    ): SemVer {
        if (SemVerHandler.SemverMainType.includes(type)) {
            // @ts-ignore
            return this.increaseSemverMainComponent(version, type, value)
        } else {
            // @ts-ignore
            return this.increaseBuildVersion(version, value)
        }
    }

    private static increaseSemverMainComponent(
        version: SemVer,
        type: "major" | "minor" | "patch",
        value: number | boolean
    ): SemVer {
        if (typeof value === "boolean") {
            version.inc(type)
        } else {
            version[type] = value
        }
        return version
    }

    private static increaseBuildVersion(
        version: SemVer,
        value: string | boolean
    ): SemVer {
        let newBuildNumber: string[]
        if (typeof value == "boolean") {
            newBuildNumber = [buildNumGen.generate()]
        } else {
            newBuildNumber = [value]
        }
        version.build = newBuildNumber
        return version
    }
}
