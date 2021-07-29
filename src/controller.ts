import fsp from "fs/promises"
import PlatformCommandController from "./platform/interface"
import yargs from "yargs"
import { hideBin } from "yargs/helpers"

import {
    RunCommandError,
    ConfigFileNotFoundError,
    InvalidConfigError
} from "./errors"

interface Config {
    platform: string
}

export default class CommandController {
    private handlerMap = new Map<string, PlatformCommandController>()

    constructor(private readonly configPath: string) {}

    addHandler(platform: string, handler: PlatformCommandController) {
        this.handlerMap.set(platform, handler)
    }

    private handleError(error: RunCommandError) {
        const { message, errorCode } = error
        console.error(message)
        process.exit(errorCode)
    }

    private isConfigValid(config: any): boolean {
        return this.handlerMap.has(config.platform)
    }

    private parseConfigFile(configString: string): Config | never {
        let config: any
        try {
            config = JSON.parse(configString)
        } catch (err) {
            throw new InvalidConfigError("Cannot parse config file")
        }
        if (!this.isConfigValid(config)) {
            throw new InvalidConfigError()
        }
        return config as Config
    }

    async execute() {
        let configString: any
        try {
            configString = await fsp.readFile(this.configPath, "utf8")
        } catch (err) {
            return this.handleError(new ConfigFileNotFoundError())
        }
        try {
            const config = this.parseConfigFile(configString)
            const handler = this.handlerMap.get(config.platform)
            const program = yargs(hideBin(process.argv))

            program.options(handler.getOptions())
            handler.execute(program.argv)
        } catch (err) {
            return this.handleError(err)
        }
    }
}
