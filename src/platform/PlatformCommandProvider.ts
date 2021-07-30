import { Options } from "yargs"

export default interface PlatformCommandProvider {
    getOptions(): Record<string, Options>
    execute(option: any): void | Promise<void>
}
