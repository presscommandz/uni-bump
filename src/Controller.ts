import fsp from "fs/promises"
import { PlatformCommandProvider } from "@platform"
import { Command, Option } from "commander"

import { CommandError, InvalidConfigError } from "@model/error"
import Provider from "@platform/Provider"

interface Config {
    provider?: string
}

export default class CommandController {
    private handlerMap = new Map<Provider, PlatformCommandProvider>()
    private readonly defaultProvider = Provider.node

    constructor(private readonly configPath: string) {}

    addHandler(platform: Provider, handler: PlatformCommandProvider) {
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
            return this.defaultProvider
        }
        const config = this.parseConfigFile(configString)
        return config.provider
    }

    async execute() {
        try {
            const program = new Command()
                .addOption(
                    new Option("--provider <provider>").choices(
                        Array.from(this.handlerMap.keys())
                    )
                )
                // Bypass help in current parse to use in next parse, when handler is called
                // TODO: Manually write help text
                .allowUnknownOption(true)
                .helpOption(false)

            let platform = program.parse().opts().platform

            if (!platform) {
                platform =
                    (await this.getPlatformFromConfigFile()) ||
                    this.defaultProvider
            }

            const handler = this.handlerMap.get(platform)
            handler.getOptions().forEach(option => program.addOption(option))
            program.allowUnknownOption(false).helpOption(true)
            handler.execute(program.parse().opts())
        } catch (err) {
            return this.handleError(err)
        }
    }
}
