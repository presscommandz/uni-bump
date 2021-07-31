import { spawnSync } from "child_process"
import _ from "lodash"
import which from "which"
import semver from "semver"
import * as buildNumGen from "build-number-generator"

import OverwriteDestinationAction from "../OverwriteDestinationAction"
import BumpProvider, { Argument } from "@platform/BumpProvider"

import BumpSwitchTypes from "@model/BumpSwitchTypes"
import {
    ArgumentError,
    ExecutableNotFoundError,
    SubcommandError
} from "@model/error"
import StatusCode from "@model/StatusCode"
import VersionType, { MainVersionTypeArray } from "@model/BumpTypes"
import Utility from "@utility"

export default class FastlaneProvider implements BumpProvider {
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
                    type: "string",
                    help: "Creates a new version specified by <version>"
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
            throw new SubcommandError("`fastlane` run unsuccessful")
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

    private handleSetNewVersion(value: string) {
        const newVersion = semver.coerce(value)
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
            throw new SubcommandError("`fastlane` run unsuccessful")
        }
    }

    execute(option: any) {
        if (!which.sync("fastlane")) {
            throw new ExecutableNotFoundError("`fastlane` must be installed")
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
                return this.handleIncreaseMainComponent(bumpType)
            case BumpSwitchTypes.build:
                return this.handleIncreaseBuildVersion(value)
            case BumpSwitchTypes.newVersion:
                return this.handleSetNewVersion(value)
            default:
                throw new ArgumentError("Unknown bump type")
        }
    }
}
