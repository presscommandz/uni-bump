import { spawn, spawnSync } from "child_process"
import semver, { SemVer } from "semver"
import which from "which"

import SemVerHandler from "../SemVerHandler"
import PlatformCommandProvider, {
    Argument
} from "@platform/PlatformCommandProvider"
import OverwriteDestinationAction from "../OverwriteDestinationAction"
import BumpSwitchTypes from "@model/BumpSwitchTypes"
import {
    CommandError,
    ArgumentError,
    ExecutableNotFoundError,
    SubcommandError,
    VersionNotFoundError
} from "@model/error"
import Utility from "@utility"

export default class AppleGenericVersioningProvider
    implements PlatformCommandProvider
{
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
        const command = spawnSync("xcrun", ["agvtool", "what-version"])
        if (command.error) {
            throw new VersionNotFoundError("Cannot find project version")
        }
        const output = command.stdout.split("\n").filter(line => line)
        const versionString = output[output.length - 1].trim()
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
        if (!which.sync("agvtool")) {
            throw new ExecutableNotFoundError("Cannot find agvtool")
        }
        let newVersion: SemVer
        const version = AppleGenericVersioningProvider.getProjectVersion()

        if (option.major) {
            newVersion = SemVerHandler.bumpVersion(
                version,
                "major",
                option.major
            )
        } else if (option.minor) {
            newVersion = SemVerHandler.bumpVersion(
                version,
                "minor",
                option.minor
            )
        } else if (option.patch) {
            newVersion = SemVerHandler.bumpVersion(
                version,
                "patch",
                option.patch
            )
        } else if (option.build) {
            newVersion = SemVerHandler.bumpVersion(
                version,
                "build",
                option.build
            )
        } else if (option.newVersion) {
            newVersion = option.newVersion
        } else {
            throw new ArgumentError("One of the bump type must be specified.")
        }

        const command = spawn(
            "xcrun",
            [
                "agvtool",
                "new-version",
                "-all",
                Utility.getVersionString(newVersion)
            ],
            {
                stdio: "inherit"
            }
        )

        command.on("close", code => {
            if (code != 0) {
                throw new SubcommandError("Command run unsuccessful")
            }
        })
    }
}
