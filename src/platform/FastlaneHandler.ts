import { spawn } from "child_process"
import which from "which"

import { Options } from "yargs"
import PlatformCommandController from "@platform/PlatformCommandController"
import Utility from "@utility"
import { ExecutableNotFoundError, SubcommandError } from "@error"

export default class FastlaneHandler implements PlatformCommandController {
    getOptions(): Record<string, Options> {
        const conflictSwitches = ["major", "minor", "patch", "new-version"]
        return {
            major: {
                type: "boolean",
                conflicts: Utility.omitFromArray(conflictSwitches, "major"),
                describe: "Incrementing the major number of current version"
            },
            minor: {
                type: "boolean",
                conflicts: Utility.omitFromArray(conflictSwitches, "minor"),
                describe: "Incrementing the minor number of current version"
            },
            patch: {
                type: "boolean",
                conflicts: Utility.omitFromArray(conflictSwitches, "patch"),
                describe: "Incrementing the patch number of current version"
            },
            "new-version": {
                type: "string",
                conflicts: Utility.omitFromArray(
                    conflictSwitches,
                    "new-version"
                ),
                describe: "Creates a new version specified by <version>"
            }
        }
    }

    execute(option: any) {
        if (!which.sync("fastlane")) {
            throw new ExecutableNotFoundError("`fastlane` must be installed")
        }
        let fastlaneArgs: string[] = ["run", "increment_version_number"]

        if (option.major) {
            fastlaneArgs.push('bump_type:"major"')
        } else if (option.minor) {
            fastlaneArgs.push('bump_type:"minor"')
        } else if (option.patch) {
            fastlaneArgs.push('bump_type:"patch"')
        } else if (option.newVersion) {
            fastlaneArgs.push(`version_number:"${option.newVersion}"`)
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
