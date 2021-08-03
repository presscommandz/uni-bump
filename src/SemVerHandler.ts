import _ from "lodash"
import { SemVer } from "semver"
import VersionType from "@model/BumpTypes"
import * as buildNumGen from "build-number-generator"

export default class SemVerHandler {
    private static readonly versionRegex =
        /^(?<major>0|[1-9]\d*)(?:\.(?<minor>0|[1-9]\d*)(?:\.(?<patch>0|[1-9]\d*))?)?(?:-(?<prerelease>(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+(?<build>[0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/

    static parseVersionString(version: string): SemVer | null {
        const groups = version.match(SemVerHandler.versionRegex)?.groups
        if (!groups) {
            return null
        }
        const {
            major = "0",
            minor = "0",
            patch = "0",
            prerelease = "",
            build = ""
        } = groups
        let fullVersionString = [major, minor, patch].join(".")
        if (prerelease !== "") {
            fullVersionString = `${fullVersionString}-${prerelease}`
        }
        if (build !== "") {
            fullVersionString = `${fullVersionString}+${build}`
        }
        return new SemVer(fullVersionString)
    }

    static incVersionComponent(version: SemVer, type: VersionType) {
        const newVersion = _.cloneDeep(version)
        switch (type) {
            case VersionType.major:
            case VersionType.minor:
            case VersionType.patch:
                newVersion.inc(type)
                newVersion.build = []
                break
            case VersionType.build:
                newVersion.build = [buildNumGen.generate().toString()]
                break
        }
        return newVersion
    }

    static setVersionComponent(
        version: SemVer,
        type: VersionType,
        value: number
    ): SemVer {
        const newVersion = _.cloneDeep(version)
        switch (type) {
            case VersionType.major:
            case VersionType.minor:
            case VersionType.patch:
                newVersion.inc(type)
                newVersion.build = []
                newVersion[type] = value
                break
            case VersionType.build:
                newVersion.build = [value.toString()]
                break
        }
        return newVersion
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
