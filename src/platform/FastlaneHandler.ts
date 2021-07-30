import { spawn } from "child_process"
import which from "which"

import { Options } from "yargs"
import PlatformCommandProvider from "@platform/PlatformCommandProvider"
import BumpSwitchTypes from "@model/BumpSwitchTypes"
import {
    ArgumentError,
    ExecutableNotFoundError,
    SubcommandError
} from "@model/error"
import Utility from "@utility"

export default class FastlaneProvider implements PlatformCommandProvider {
    getOptions(): Record<string, Options> {
        return {
            [BumpSwitchTypes.major]: {
                type: "boolean",
                conflicts: Utility.omitFromArray(
                    Object.values(BumpSwitchTypes),
                    BumpSwitchTypes.major
                ),
                describe: "Incrementing the major number of current version"
            },
            [BumpSwitchTypes.minor]: {
                type: "boolean",
                conflicts: Utility.omitFromArray(
                    Object.values(BumpSwitchTypes),
                    BumpSwitchTypes.minor
                ),
                describe: "Incrementing the minor number of current version"
            },
            [BumpSwitchTypes.build]: {
                type: "boolean",
                conflicts: Utility.omitFromArray(
                    Object.values(BumpSwitchTypes),
                    BumpSwitchTypes.build
                ),
                describe: "Incrementing the patch number of current version"
            },
            [BumpSwitchTypes.patch]: {
                type: "boolean",
                conflicts: Utility.omitFromArray(
                    Object.values(BumpSwitchTypes),
                    BumpSwitchTypes.patch
                ),
                describe: "Incrementing the patch number of current version"
            },
            [BumpSwitchTypes.newVersion]: {
                type: "string",
                conflicts: Utility.omitFromArray(
                    Object.values(BumpSwitchTypes),
                    BumpSwitchTypes.newVersion
                ),
                describe: "Creates a new version specified by <version>"
            }
        }
    }

    execute(option: any) {
        if (!which.sync("fastlane")) {
            throw new ExecutableNotFoundError("`fastlane` must be installed")
        }
        let fastlaneArgs: string[] = ["run"]

        if (option.major) {
            fastlaneArgs.push("increment_version_number", "bump_type:major")
        } else if (option.minor) {
            fastlaneArgs.push("increment_version_number", "bump_type:minor")
        } else if (option.patch) {
            fastlaneArgs.push("increment_version_number", "bump_type:patch")
        } else if (option.build) {
            fastlaneArgs.push("increment_build_number")
        } else if (option.newVersion) {
            fastlaneArgs.push(
                "increment_version_number",
                `version_number:${option.newVersion}`
            )
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
