import { spawn } from "child_process"
import fs from "fs"
import path from "path"
import semver, { SemVer } from "semver"
import which from "which"
import * as buildNumGen from "build-number-generator"

import { Option } from "commander"
import ArgumentParser from "../ArgumentParser"
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
    getOptions(): Option[] {
        return [
            new Option(
                BumpSwitchTypes.major,
                "Incrementing the major number of current version"
            ).argParser(ArgumentParser.parseIntOrBooleanArgument),
            new Option(
                BumpSwitchTypes.minor,
                "Incrementing the minor number of current version"
            ).argParser(ArgumentParser.parseIntOrBooleanArgument),
            new Option(
                BumpSwitchTypes.patch,
                "Incrementing the patch number of current version"
            ).argParser(ArgumentParser.parseIntOrBooleanArgument),
            new Option(
                BumpSwitchTypes.build,
                "Incrementing the build number of current version"
            ),
            new Option(
                BumpSwitchTypes.newVersion,
                "Creates a new version specified by <version>"
            ).argParser(ArgumentParser.parseVersionArgument)
        ]
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

    private static getProjectVersion(): semver.SemVer | never {
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
        return version
    }

    private increaseSemverMainComponent(
        version: SemVer,
        type: "major" | "minor" | "patch",
        value: number | boolean
    ): SemVer {
        if (typeof value === "boolean") {
            version.inc(type)
        } else {
            version[type] = value
        }
        return version
    }

    private increaseBuildVersion(
        version: SemVer,
        value: string | boolean
    ): SemVer {
        let newBuildNumber: string[]
        if (typeof value == "boolean") {
            newBuildNumber = [buildNumGen.generate()]
        } else {
            newBuildNumber = [value]
        }
        version.build = newBuildNumber
        return version
    }

    private handleIncreaseOrSetVersion(
        type: "major" | "minor" | "patch" | "build",
        value: string | number | boolean
    ): SemVer {
        const version = NodeProvider.getProjectVersion()
        const semverReleaseType = ["major", "minor", "patch"]
        if (semverReleaseType.includes(type)) {
            // @ts-ignore
            return this.increaseSemverMainComponent(version, type, value)
        } else {
            // @ts-ignore
            return this.increaseBuildVersion(version, value)
        }
    }

    execute(option: any) {
        let newVersion: SemVer

        if (option.major) {
            newVersion = this.handleIncreaseOrSetVersion("major", option.major)
        } else if (option.minor) {
            newVersion = this.handleIncreaseOrSetVersion("minor", option.minor)
        } else if (option.patch) {
            newVersion = this.handleIncreaseOrSetVersion("patch", option.patch)
        } else if (option.build) {
            newVersion = this.handleIncreaseOrSetVersion("build", option.build)
        } else if (option.newVersion) {
            newVersion = option.newVersion
        } else {
            throw new ArgumentError("One of the bump type must be specified.")
        }

        let executable: string
        let args: string[]

        if (which.sync("yarn")) {
            executable = "yarn"
            args = [
                "version",
                "--no-git-tag-version",
                "--no-commit-hooks",
                "--new-version",
                Utility.getVersionString(newVersion)
            ]
        } else if (which.sync("npm")) {
            executable = "npm"
            args = [
                "version",
                "--no-git-tag-version",
                "--no-commit-hooks",
                Utility.getVersionString(newVersion)
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
