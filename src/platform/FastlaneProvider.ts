import { spawn, spawnSync } from "child_process"
import which from "which"

import semver from "semver"
import { Option } from "commander"
import PlatformCommandProvider from "@platform/PlatformCommandProvider"
import BumpSwitchTypes from "@model/BumpSwitchTypes"
import {
    CommandError,
    ArgumentError,
    ExecutableNotFoundError,
    SubcommandError,
    VersionNotFoundError
} from "@model/error"
import SemVerHandler from "../SemVerHandler"
import Utility from "@utility"

export default class FastlaneProvider implements PlatformCommandProvider {
    getOptions(): Option[] {
        return [
            new Option(
                BumpSwitchTypes.major,
                "Incrementing the major number of current version"
            ),
            new Option(
                BumpSwitchTypes.minor,
                "Incrementing the minor number of current version"
            ),
            new Option(
                BumpSwitchTypes.patch,
                "Incrementing the patch number of current version"
            ),
            new Option(
                BumpSwitchTypes.build,
                "Incrementing the build number of current version"
            ),
            new Option(
                BumpSwitchTypes.newVersion,
                "Creates a new version specified by <version>"
            )
        ]
    }

    private static getProjectVersion(): semver.SemVer | never {
        const command = spawnSync("fastlane", ["run", "get_version_number"])
        if (command.error) {
            throw new VersionNotFoundError("Cannot find project version")
        }
        const versionString = command.stdout.trim()
        const version = semver.parse(versionString)
        if (!version) {
            throw new CommandError(
                "Cannot understand current version semantic.",
                undefined,
                -1
            )
        }
        return version
    }

    execute(option: any) {
        if (!which.sync("fastlane")) {
            throw new ExecutableNotFoundError("`fastlane` must be installed")
        }

        let fastlaneArgs: string[] = ["run"]

        if (option.build) {
            fastlaneArgs.push("increment_build_number")
            if (typeof option.build !== "boolean") {
                fastlaneArgs.push(`build_number:${option.build}`)
            }
        } else if (option.newVersion) {
            fastlaneArgs.push(
                "increment_version_number",
                `version_number:${option.newVersion}`
            )
        } else if (
            [option.major, option.minor, option.patch].every(val => val)
        ) {
            for (const bumpType of ["major", "minor", "patch"]) {
                if (!option[bumpType]) {
                    continue
                }
                const value = option[bumpType]
                if (typeof value == "boolean") {
                    fastlaneArgs.push(
                        "increment_version_number",
                        `bump_type:${bumpType}`
                    )
                } else {
                    const version = FastlaneProvider.getProjectVersion()
                    const newVersion = SemVerHandler.bumpVersion(
                        version,
                        // @ts-ignore
                        bumpType,
                        value
                    )
                    fastlaneArgs.push(
                        "increment_version_number",
                        `version_number:${Utility.getVersionString(newVersion)}`
                    )
                }
            }
        } else {
            throw new ArgumentError("One of the bump type must be specified.")
        }

        const command = spawn("fastlane", fastlaneArgs, {
            stdio: "inherit"
        })
        command.on("close", code => {
            if (code != 0) {
                throw new SubcommandError("Command run unsuccessful")
            }
        })
    }
}
