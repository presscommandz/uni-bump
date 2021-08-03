import { spawnSync, SpawnSyncReturns } from "child_process"
import fs from "fs"
import path from "path"
import _ from "lodash"
import semver, { SemVer } from "semver"
import which from "which"
import * as argparse from "argparse"

import OverwriteDestinationAction from "../OverwriteDestinationAction"
import SemVerHandler from "../SemVerHandler"
import BumpProvider, { Argument } from "@platform/BumpProvider"
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
import VersionType from "@model/BumpTypes"
import StatusCode from "@model/StatusCode"
import BumpBuildNumberType from "@model/BumpBuildNumberType"

class NodeProvider implements BumpProvider {
    getOptions(): Argument[] {
        // @ts-ignore
        return [
            {
                flags: [BumpSwitchTypes.major],
                options: {
                    dest: "bump",
                    action: OverwriteDestinationAction,
                    nargs: argparse.Const.OPTIONAL,
                    type: "int",
                    help: "Incrementing the major number of current version"
                }
            },
            {
                flags: [BumpSwitchTypes.minor],
                options: {
                    dest: "bump",
                    action: OverwriteDestinationAction,
                    nargs: argparse.Const.OPTIONAL,
                    type: "int",
                    help: "Incrementing the minor number of current version"
                }
            },
            {
                flags: [BumpSwitchTypes.patch],
                options: {
                    dest: "bump",
                    action: OverwriteDestinationAction,
                    nargs: argparse.Const.OPTIONAL,
                    type: "int",
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
                flags: [NodeProvider.NodeSwitches.buildType],
                options: {
                    type: "string",
                    defaultValue: BumpBuildNumberType.timestamp,
                    choices: [
                        BumpBuildNumberType.increment,
                        BumpBuildNumberType.timestamp
                    ]
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

    private setVersion(value: SemVer, executable: NodeProvider.Executable) {
        const versionString = SemVerHandler.getVersionString(value)
        let command: SpawnSyncReturns<any>
        if (executable == NodeProvider.Executable.npm) {
            command = spawnSync(
                NodeProvider.Executable.npm,
                ["version", versionString],
                {
                    stdio: "inherit"
                }
            )
        } else {
            command = spawnSync(
                NodeProvider.Executable.yarn,
                ["version", "--new-version", versionString],
                { stdio: "inherit" }
            )
        }
        if (command.error || command.status != StatusCode.ExitSuccess) {
            throw new SubcommandError("Set version unsuccessful")
        }
    }

    private bumpMainVersionComponentNumber(
        bumpType: VersionType,
        value: boolean | number,
        executable: NodeProvider.Executable
    ) {
        const version = NodeProvider.getProjectVersion()
        let newVersion: SemVer
        if (typeof value == "boolean") {
            newVersion = SemVerHandler.incVersionComponent(version, bumpType)
        } else {
            newVersion = SemVerHandler.setVersionComponent(
                version,
                bumpType,
                value
            )
        }
        this.setVersion(newVersion, executable)
    }

    private bumpBuildVersion(
        bumpType: BumpBuildNumberType,
        value: boolean | number,
        executable: NodeProvider.Executable
    ) {
        console.log("bumptype:", bumpType)
        const version = NodeProvider.getProjectVersion()
        let newVersion: SemVer
        if (typeof value != "boolean") {
            newVersion = SemVerHandler.setVersionComponent(
                version,
                VersionType.build,
                value
            )
        } else if (bumpType == BumpBuildNumberType.increment) {
            let currentBuildNumber = parseInt(_.head(version.build))
            if (!Number.isInteger(currentBuildNumber)) {
                currentBuildNumber = 0
            }
            newVersion = SemVerHandler.setVersionComponent(
                version,
                VersionType.build,
                currentBuildNumber + 1
            )
        } else {
            newVersion = SemVerHandler.incVersionComponent(
                version,
                VersionType.build
            )
        }
        return this.setVersion(newVersion, executable)
    }

    private static getExecutable(): NodeProvider.Executable | null {
        for (let executable of NodeProvider.ExecutableList) {
            if (which.sync(executable)) {
                return executable
            }
        }
        return null
    }

    execute(option: Record<string, any>, _config: Config) {
        console.log(option)
        const executable = NodeProvider.getExecutable()
        if (!executable) {
            throw new ExecutableNotFoundError(
                "`yarn` or `npm` must be installed."
            )
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
                return this.bumpMainVersionComponentNumber(
                    Utility.getVersionTypeFromSwitch(switchOpt),
                    value,
                    executable
                )
            case BumpSwitchTypes.build:
                const bumpBuildType = option.build_type as BumpBuildNumberType
                return this.bumpBuildVersion(bumpBuildType, value, executable)

            case BumpSwitchTypes.newVersion:
                newVersion = SemVerHandler.parseVersionString(value)
                if (!newVersion) {
                    throw new ArgumentError("Version is invalid")
                }
                return this.setVersion(newVersion, executable)
            default:
                throw new ArgumentError("Unknown bump type")
        }
    }
}

namespace NodeProvider {
    export enum NodeSwitches {
        buildType = "--build-type"
    }

    export const enum Executable {
        npm = "npm",
        yarn = "yarn"
    }
    export const ExecutableList = [Executable.yarn, Executable.npm]
}

export default NodeProvider
