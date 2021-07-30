import { spawn } from "child_process"
import which from "which"

import { Option } from "commander"
import PlatformCommandProvider from "@platform/PlatformCommandProvider"
import BumpSwitchTypes from "@model/BumpSwitchTypes"
import {
    ArgumentError,
    ExecutableNotFoundError,
    SubcommandError
} from "@model/error"

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
