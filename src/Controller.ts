import fsp from "fs/promises"
import { BumpProvider } from "@platform"
import { ArgumentParser } from "argparse"

import Config from "@model/Config"
import { CommandError, InvalidConfigError } from "@model/error"

export default class CommandController {
    private handlerMap = new Map<BumpProvider.Provider, BumpProvider>()
    private readonly defaultProvider = BumpProvider.Provider.node
    private readonly configPath: string

    constructor(configPath: string) {
        this.configPath = configPath
    }

    addHandler(platform: BumpProvider.Provider, handler: BumpProvider) {
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

    private async getConfigFromFile(): Promise<Config> {
        let configString: any
        try {
            configString = await fsp.readFile(this.configPath, "utf8")
        } catch (err) {
            return {}
        }
        const config = this.parseConfigFile(configString)
        return config
    }

    async execute() {
        try {
            // Bypass help in current parse to use in next parse, when handler is called
            // TODO: Manually write help text
            const initProgram = new ArgumentParser({
                addHelp: false
            })
            initProgram.addArgument("--provider", {
                type: "string",
                choices: Array.from(this.handlerMap.keys())
            })

            const config = await this.getConfigFromFile()

            let provider =
                initProgram.parseKnownArgs()[0].provider ||
                config.provider ||
                this.defaultProvider

            const handler = this.handlerMap.get(provider)
            const program = new ArgumentParser()
            program.addArgument("--provider", {
                type: "string",
                choices: Array.from(this.handlerMap.keys())
            })

            handler.getOptions().forEach(argument => {
                program.addArgument(argument.flags, argument.options)
            })
            await handler.execute(program.parseArgs(), config)
        } catch (err) {
            return this.handleError(err)
        }
    }
}
