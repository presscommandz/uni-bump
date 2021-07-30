import { spawn } from "child_process"
import fs from "fs"
import path from "path"
import semver from "semver"
import which from "which"
import * as buildNumGen from "build-number-generator"

import { Options } from "yargs"
import PlatformCommandProvider from "@platform/PlatformCommandProvider"
import BumpSwitchTypes from "@model/BumpSwitchTypes"
import {
    CommandError,
    ArgumentError,
    ExecutableNotFoundError,
    SubcommandError,
    ProjectRootNotFoundError
} from "@model/error"
import Utility from "@utility"

export default class NodeProvider implements PlatformCommandProvider {
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
            [BumpSwitchTypes.patch]: {
                type: "boolean",
                conflicts: Utility.omitFromArray(
                    Object.values(BumpSwitchTypes),
                    BumpSwitchTypes.patch
                ),
                describe: "Incrementing the patch number of current version"
            },
            [BumpSwitchTypes.build]: {
                type: "boolean",
                conflicts: Utility.omitFromArray(
                    Object.values(BumpSwitchTypes),
                    BumpSwitchTypes.build
                ),
                describe: "Incrementing the build number of current version"
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

    private static findProjectRoot(
        startDirectory = process.cwd()
    ): string | undefined {
        for (let directory of Utility.walkUpPath(startDirectory)) {
            if (fs.existsSync(path.join(directory, "package.json"))) {
                return directory
            }
        }
    }

    private static getNewBuildVersion(): string | never {
        const projectRoot = NodeProvider.findProjectRoot()
        if (!projectRoot) {
            throw new ProjectRootNotFoundError(
                "Cannot find project root to determine project version"
            )
        }
        let pkg
        try {
            pkg = JSON.parse(
                fs.readFileSync(path.join(projectRoot, "package.json"), "utf-8")
            )
        } catch (err) {
            throw new ProjectRootNotFoundError("Cannot find `package.json`")
        }

        const version = semver.parse(pkg.version)
        if (!version) {
            throw new CommandError(
                "Cannot understand current version semantic.",
                undefined,
                -1
            )
        }
        const newVersion = `${version.major}.${version.minor}.${
            version.patch
        }+${buildNumGen.generate()}`
        return newVersion
    }

    private executeUsingYarn(option) {
        let yarnArgs: string[] = [
            "version",
            "--no-git-tag-version",
            "--no-commit-hooks"
        ]

        if (option.major) {
            yarnArgs.push("--major")
        } else if (option.minor) {
            yarnArgs.push("--minor")
        } else if (option.patch) {
            yarnArgs.push("--patch")
        } else if (option.build) {
            const newVersion = NodeProvider.getNewBuildVersion()
            yarnArgs.push("--new-version", newVersion)
        } else if (option.newVersion) {
            yarnArgs.push("--new-version", option.newVersion)
        } else {
            throw new ArgumentError("One of the bump type must be specified.")
        }

        const command = spawn("yarn", yarnArgs, {
            stdio: "inherit"
        })
        command.on("close", code => {
            if (code != 0) {
                throw new SubcommandError("Command run unsuccessful")
            }
        })
    }

    private executeUsingNpm(option) {
        let npmArgs: string[] = [
            "version",
            "--no-git-tag-version",
            "--no-commit-hooks"
        ]

        if (option.major) {
            npmArgs.push("major")
        } else if (option.minor) {
            npmArgs.push("minor")
        } else if (option.patch) {
            npmArgs.push("patch")
        } else if (option.build) {
            const newVersion = NodeProvider.getNewBuildVersion()
            npmArgs.push(newVersion)
        } else if (option.newVersion) {
            npmArgs.push(option.newVersion)
        } else {
            throw new ArgumentError("One of the bump type must be specified.")
        }

        const command = spawn("npm", npmArgs, {
            stdio: "inherit"
        })
        command.on("close", code => {
            if (code != 0) {
                throw new SubcommandError("Command run unsuccessful")
            }
        })
    }

    execute(option: any) {
        if (which.sync("yarn")) {
            return this.executeUsingYarn(option)
        } else if (which.sync("npm")) {
            return this.executeUsingNpm(option)
        }

        throw new ExecutableNotFoundError("`yarn` or `npm` must be installed.")
    }
}
