import _ from "lodash"
import { SemVer } from "semver"
import VersionType from "@model/BumpTypes"
import * as buildNumGen from "build-number-generator"

export default class SemVerHandler {
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
