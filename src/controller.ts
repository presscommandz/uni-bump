import fsp from "fs/promises"
import { PlatformCommandProvider } from "@platform"
import yargs from "yargs"
import { hideBin } from "yargs/helpers"

import { CommandError, InvalidConfigError } from "@error"
import Platform from "@platform/Platform"

interface Config {
    platform?: string
}

export default class CommandController {
    private handlerMap = new Map<Platform, PlatformCommandProvider>()
    private readonly defaultPlatform = Platform.node

    constructor(private readonly configPath: string) {}

    addHandler(platform: Platform, handler: PlatformCommandProvider) {
        this.handlerMap.set(platform, handler)
    }

    private handleError(error: CommandError) {
        const { message, errorCode } = error
        console.error(message)
        process.exit(errorCode)
    }

    private parseConfigFile(configString: string): Config {
        let config: any
        try {
            config = JSON.parse(configString)
        } catch (err) {
            throw new InvalidConfigError()
        }
        return config as Config
    }

    private async getPlatformFromConfigFile() {
        let configString: any
        try {
            configString = await fsp.readFile(this.configPath, "utf8")
        } catch (err) {
            return this.defaultPlatform
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
                // TODO: Manually write help text
                .help(false)
            // @ts-ignore
            let platform = program.argv.platform

            if (!platform) {
                platform =
                    (await this.getPlatformFromConfigFile()) ||
                    this.defaultPlatform
            }

            const handler = this.handlerMap.get(platform)
            program.options(handler.getOptions()).help(true)
            handler.execute(program.argv)
        } catch (err) {
            return this.handleError(err)
        }
    }
}
