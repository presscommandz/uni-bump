import { spawnSync } from "child_process"
import _ from "lodash"
import which from "which"
import * as argparse from "argparse"
import * as buildNumGen from "build-number-generator"
import SemVerHandler from "../SemVerHandler"

import OverwriteDestinationAction from "../OverwriteDestinationAction"
import BumpProvider, { Argument } from "@platform/BumpProvider"

import BumpSwitchTypes from "@model/BumpSwitchTypes"
import {
    ArgumentError,
    ExecutableNotFoundError,
    SubcommandError
} from "@model/error"
import StatusCode from "@model/StatusCode"
import Config from "@model/Config"
import VersionType, { MainVersionTypeArray } from "@model/BumpTypes"
import Utility from "@utility"

class FastlaneProvider implements BumpProvider {
    getOptions(): Argument[] {
        return [
            {
                flags: [BumpSwitchTypes.major],
                options: {
                    dest: "bump",
                    action: OverwriteDestinationAction,
                    nargs: 0,
                    help: "Incrementing the major number of current version"
                }
            },
            {
                flags: [BumpSwitchTypes.minor],
                options: {
                    dest: "bump",
                    action: OverwriteDestinationAction,
                    nargs: 0,
                    help: "Incrementing the minor number of current version"
                }
            },
            {
                flags: [BumpSwitchTypes.patch],
                options: {
                    dest: "bump",
                    action: OverwriteDestinationAction,
                    nargs: 0,
                    help: "Incrementing the patch number of current version"
                }
            },
            {
                flags: [BumpSwitchTypes.build],
                options: {
                    dest: "bump",
                    action: OverwriteDestinationAction,
                    nargs: argparse.Const.OPTIONAL,
                    type: "int",
                    help: "Incrementing the build number of current version"
                }
            },
            {
                flags: [BumpSwitchTypes.newVersion],
                options: {
                    dest: "bump",
                    action: OverwriteDestinationAction,
                    type: "string",
                    help: "Creates a new version specified by <version>"
                }
            },
            {
                flags: [FastlaneProvider.FastlaneSwitches.message],
                options: {
                    type: "string",
                    nargs: argparse.Const.OPTIONAL,
                    help: "Specify version bump commit message"
                }
            },
            {
                flags: [FastlaneProvider.FastlaneSwitches.xcodeproj],
                options: {
                    type: "string",
                    nargs: argparse.Const.OPTIONAL,
                    help: "Specify main project"
                }
            }
        ]
    }

    private handleIncreaseMainComponent(type: VersionType) {
        if (!MainVersionTypeArray.includes(type)) {
            throw new Error(
                "Version type must be 'major', 'minor' or 'patch' to use this function"
            )
        }
        const command = spawnSync(
            "fastlane",
            ["run", "increment_version_number", `bump_type:${type}`],
            { stdio: "inherit" }
        )
        if (command.error || command.status != StatusCode.ExitSuccess) {
            throw new SubcommandError(`fastlane bump ${type} unsuccessful`)
        }
    }

    private handleIncreaseBuildVersion(value: string | boolean) {
        if (typeof value == "boolean") {
            value = buildNumGen.generate()
        }
        const command = spawnSync(
            "fastlane",
            ["run", "increment_build_number", `build_number:${value}`],
            { stdio: "inherit" }
        )
        if (command.error || command.status != StatusCode.ExitSuccess) {
            throw new SubcommandError("`fastlane` run unsuccessful")
        }
    }

    private getXcodeProjPath(option: Record<string, any>, config: Config) {
        if (option.xcodeproj) {
            return option.xcodeproj
        }
        return config?.providerConfig?.fastlane?.xcodeproj
    }

    private handleSetNewVersion(value: string) {
        const newVersion = SemVerHandler.parseVersionString(value)
        if (_.isNil(newVersion)) {
            throw new ArgumentError(
                `Cannot understand version semantic of "${value}"`
            )
        }
        const command = spawnSync(
            "fastlane",
            ["run", "increment_version_number", `version_number:${value}`],
            { stdio: "inherit" }
        )
        if (command.error || command.status != StatusCode.ExitSuccess) {
            throw new SubcommandError("fastlane set new version unsuccessful")
        }
    }

    execute(option: any, config: Config) {
        if (!which.sync("fastlane")) {
            throw new ExecutableNotFoundError(
                "fastlane must be installed before using fastlane provider"
            )
        }

        if (!option.bump || !option.bump.switchOpt) {
            throw new ArgumentError("One of the bump type must be specified")
        }

        const { switchOpt, value } = option.bump

        switch (switchOpt) {
            case BumpSwitchTypes.major:
            case BumpSwitchTypes.minor:
            case BumpSwitchTypes.patch:
                const bumpType = Utility.getVersionTypeFromSwitch(switchOpt)
                this.handleIncreaseMainComponent(bumpType)
                break
            case BumpSwitchTypes.build:
                this.handleIncreaseBuildVersion(value)
                break
            case BumpSwitchTypes.newVersion:
                this.handleSetNewVersion(value)
                break
            default:
                throw new ArgumentError("Unknown bump type")
        }

        const fastlaneCommitArgs = ["run", "commit_version_bump"]
        if (option.message) {
            fastlaneCommitArgs.push(`message:${option.message}`)
        }
        const xcodeproj = this.getXcodeProjPath(option, config)
        if (xcodeproj) {
            fastlaneCommitArgs.push(`xcodeproj:${xcodeproj}`)
        }
        const commitCommand = spawnSync("fastlane", fastlaneCommitArgs, {
            stdio: "inherit"
        })
        if (
            commitCommand.error ||
            commitCommand.status != StatusCode.ExitSuccess
        ) {
            throw new SubcommandError(
                "`fastlane` commit command run unsuccessful"
            )
        }
    }
}

namespace FastlaneProvider {
    export enum FastlaneSwitches {
        message = "--message",
        xcodeproj = "--xcodeproj"
    }
}

export default FastlaneProvider
