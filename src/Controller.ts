import fsp from "fs/promises"
import { PlatformCommandProvider } from "@platform"
import { ArgumentParser } from "argparse"

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

    private async getProviderFromConfigFile() {
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
            // Bypass help in current parse to use in next parse, when handler is called
            // TODO: Manually write help text
            const initProgram = new ArgumentParser({
                addHelp: false
            })
            initProgram.addArgument("--provider", {
                type: "string",
                choices: Array.from(this.handlerMap.keys())
            })

            let provider = initProgram.parseKnownArgs()[0].provider
            console.log("pl", initProgram.parseKnownArgs(), provider)

            if (!provider) {
                provider =
                    (await this.getProviderFromConfigFile()) ||
                    this.defaultProvider
            }

            const handler = this.handlerMap.get(provider)
            const program = new ArgumentParser()

            handler.getOptions().forEach(argument => {
                program.addArgument(argument.flags, argument.options)
            })
            await handler.execute(program.parseKnownArgs()[0])
        } catch (err) {
            return this.handleError(err)
        }
    }
}
