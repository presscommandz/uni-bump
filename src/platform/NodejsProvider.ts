import { spawn } from "child_process"
import fs from "fs"
import path from "path"
import semver, { SemVer } from "semver"
import which from "which"

import OverwriteDestinationAction from "../OverwriteDestinationAction"
import SemVerHandler from "../SemVerHandler"
import BumpProvider, { Argument } from "@platform/BumpProvider"
import BumpSwitchTypes from "@model/BumpSwitchTypes"
import VersionType from "@model/BumpTypes"
import {
    CommandError,
    ArgumentError,
    ExecutableNotFoundError,
    SubcommandError,
    VersionNotFoundError
} from "@model/error"
import Config from "@model/Config"
import Utility from "@utility"

export default class NodeProvider implements BumpProvider {
    getOptions(): Argument[] {
        // @ts-ignore
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
            }
        ]
    }

    private static findProjectRoot(
        startDirectory = process.cwd()
    ): string | never {
        let prev = null
        let dir = startDirectory
        do {
            if (fs.existsSync(path.join(dir, "package.json"))) {
                return dir
            }
            prev = dir
            dir = path.dirname(dir)
        } while (prev != dir)
        throw new VersionNotFoundError(
            "Cannot find project root to determine project version"
        )
    }

    private static getProjectVersion(): semver.SemVer | never {
        const projectRoot = NodeProvider.findProjectRoot()
        let pkg
        try {
            pkg = JSON.parse(
                fs.readFileSync(path.join(projectRoot, "package.json"), "utf-8")
            )
        } catch (err) {
            throw new VersionNotFoundError("Cannot find root of project.")
        }

        const version = SemVerHandler.parseVersionString(pkg.version)
        if (!version) {
            throw new CommandError(
                "Cannot understand project version.",
                undefined,
                -1
            )
        }
        return version
    }

    execute(option: Record<string, any>, _config: Config) {
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
                const version = NodeProvider.getProjectVersion()
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

        let executable: string
        let args: string[]

        if (which.sync("yarn")) {
            executable = "yarn"
            args = [
                "version",
                "--new-version",
                SemVerHandler.getVersionString(newVersion)
            ]
        } else if (which.sync("npm")) {
            executable = "npm"
            args = [
                "version",
                "--no-git-tag-version",
                "--no-commit-hooks",
                SemVerHandler.getVersionString(newVersion)
            ]
        } else {
            throw new ExecutableNotFoundError(
                "`yarn` or `npm` must be installed."
            )
        }

        const command = spawn(executable, args, {
            stdio: "inherit"
        })
        command.on("close", code => {
            if (code != 0) {
                throw new SubcommandError("Command run unsuccessful")
            }
        })
    }
}
