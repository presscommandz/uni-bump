import { spawn, spawnSync } from "child_process"
import semver, { SemVer } from "semver"
import which from "which"
import _ from "lodash"

import SemVerHandler from "../SemVerHandler"
import BumpProvider, { Argument } from "@platform/BumpProvider"
import OverwriteDestinationAction from "../OverwriteDestinationAction"
import VersionType from "@model/BumpTypes"
import BumpSwitchTypes from "@model/BumpSwitchTypes"
import {
    CommandError,
    ArgumentError,
    ExecutableNotFoundError,
    SubcommandError,
    VersionNotFoundError
} from "@model/error"
import Config from "@model/Config"
import Utility from "@utility"

export default class AppleGenericVersioningProvider implements BumpProvider {
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
        const versionString = _.last(output).trim()
        const version = SemVerHandler.parseVersionString(versionString)
        if (!version) {
            throw new CommandError(
                "Cannot understand current version semantic.",
                undefined,
                -1
            )
        }
        return version
    }

    execute(option: Record<string, any>, _config: Config) {
        if (!which.sync("agvtool")) {
            throw new ExecutableNotFoundError("Cannot find agvtool")
        }

        if (!option.bump || !option.bump.switchOpt) {
            throw new ArgumentError("One of the bump type must be specified")
        }
        const { switchOpt, value } = option.bump

        let newVersion: SemVer
        switch (switchOpt) {
            case BumpSwitchTypes.major:
            case BumpSwitchTypes.minor:
            case BumpSwitchTypes.patch:
            case BumpSwitchTypes.build:
                const bumpType = Utility.getVersionTypeFromSwitch(switchOpt)
                const version =
                    AppleGenericVersioningProvider.getProjectVersion()
                if (typeof value == "boolean") {
                    newVersion = SemVerHandler.incVersionComponent(
                        version,
                        bumpType as VersionType
                    )
                } else {
                    newVersion = SemVerHandler.setVersionComponent(
                        version,
                        bumpType as VersionType,
                        value
                    )
                }
                break
            case BumpSwitchTypes.newVersion:
                newVersion = SemVerHandler.parseVersionString(value)
                if (!newVersion) {
                    throw new ArgumentError("Version is invalid")
                }
                break
            default:
                throw new ArgumentError("Unknown bump type")
        }

        const command = spawn(
            "xcrun",
            [
                "agvtool",
                "new-version",
                "-all",
                SemVerHandler.getVersionString(newVersion)
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
