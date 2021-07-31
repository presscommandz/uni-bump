import { spawn, spawnSync } from "child_process"
import which from "which"

import semver from "semver"
import OverwriteDestinationAction from "../OverwriteDestinationAction"
import PlatformCommandProvider, {
    Argument
} from "@platform/PlatformCommandProvider"
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
    getOptions(): Argument[] {
        return [
            {
                flags: [BumpSwitchTypes.major],
                options: {
                    dest: "bump",
                    action: OverwriteDestinationAction,
                    nargs: "?",
                    type: "int",
                    help: "Incrementing the major number of current version"
                }
            },
            {
                flags: [BumpSwitchTypes.minor],
                options: {
                    dest: "bump",
                    action: OverwriteDestinationAction,
                    nargs: "?",
                    type: "int",
                    help: "Incrementing the minor number of current version"
                }
            },
            {
                flags: [BumpSwitchTypes.patch],
                options: {
                    dest: "bump",
                    action: OverwriteDestinationAction,
                    nargs: "?",
                    type: "int",
                    help: "Incrementing the patch number of current version"
                }
            },
            {
                flags: [BumpSwitchTypes.build],
                options: {
                    dest: "bump",
                    action: OverwriteDestinationAction,
                    nargs: "?",
                    type: "string",
                    help: "Incrementing the build number of current version"
                }
            },
            {
                flags: [BumpSwitchTypes.newVersion],
                options: {
                    dest: "bump",
                    action: OverwriteDestinationAction,
                    nargs: "?",
                    type: "string",
                    help: "Creates a new version specified by <version>"
                }
            }
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
            [option.major, option.minor, option.patch].some(val => val)
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
