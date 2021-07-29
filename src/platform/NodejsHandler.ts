import { spawn } from "child_process"
import fs from "fs"
import path from "path"
import semver from "semver"
import which from "which"
import * as buildNumGen from "build-number-generator"

import { Options } from "yargs"
import PlatformCommandController from "./PlatformCommandController"
import {
    BumpVersionError,
    ExecutableNotFoundError,
    SubcommandError
} from "../error/errors"

export default class NodePlatformHandler implements PlatformCommandController {
    getOptions(): Record<string, Options> {
        return {
            major: {
                type: "boolean",
                conflicts: ["minor", "patch", "build"]
            },
            minor: {
                type: "boolean",
                conflicts: ["major", "patch", "build"]
            },
            patch: {
                type: "boolean",
                conflicts: ["major", "minor", "build"]
            },
            build: {
                type: "boolean",
                conflicts: ["major", "minor", "patch"]
            },
            "new-version": {
                type: "string",
                conflicts: ["major", "minor", "patch", "build"]
            }
        }
    }

    private getNewBuildVersion(): string | never {
        let pkg
        try {
            pkg = JSON.parse(
                fs.readFileSync(
                    path.join(process.cwd(), "package.json"),
                    "utf-8"
                )
            )
        } catch (err) {
            throw new BumpVersionError(
                "Cannot find `package.json` in current directory.",
                undefined,
                1
            )
        }

        const version = semver.parse(pkg.version)
        if (!version) {
            throw new BumpVersionError(
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
            const newVersion = this.getNewBuildVersion()
            yarnArgs.push("--new-version", newVersion)
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
            const newVersion = this.getNewBuildVersion()
            npmArgs.push(newVersion)
        }

        const command = spawn("npm", npmArgs, {
            stdio: "inherit"
        })
        command.on("close", code => {
            if (code != 0) {
                throw new BumpVersionError(
                    "Command run unsuccessful",
                    undefined,
                    code
                )
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
