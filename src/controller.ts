import fsp from "fs/promises"
import PlatformCommandController from "@platform/PlatformCommandController"
import yargs from "yargs"
import { hideBin } from "yargs/helpers"

import {
    CommandError,
    ConfigFileNotFoundError,
    InvalidConfigError
} from "@error"

interface Config {
    platform: string
}

export default class CommandController {
    private handlerMap = new Map<string, PlatformCommandController>()

    constructor(private readonly configPath: string) {}

    addHandler(platform: string, handler: PlatformCommandController) {
        this.handlerMap.set(platform, handler)
    }

    private handleError(error: CommandError) {
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

    private async getPlatformFromConfigFile() {
        let configString: any
        try {
            configString = await fsp.readFile(this.configPath, "utf8")
        } catch (err) {
            throw new ConfigFileNotFoundError()
        }
        const config = this.parseConfigFile(configString)
        return config.platform
    }

    async execute() {
        try {
            const program = yargs(hideBin(process.argv))
                .options({
                    platform: {
                        type: "string",
                        choices: Array.from(this.handlerMap.keys())
                    }
                })
                // Bypass help in current parse to use in next parse, when handler is called
                .help(false)
            // @ts-ignore
            let platform = program.argv.platform

            if (!platform) {
                platform = await this.getPlatformFromConfigFile()
            }

            const handler = this.handlerMap.get(platform)
            program.options(handler.getOptions()).help(true)
            handler.execute(program.argv)
        } catch (err) {
            return this.handleError(err)
        }
    }
}
