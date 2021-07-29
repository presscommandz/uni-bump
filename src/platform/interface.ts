import type { Options } from "yargs"

export default interface PlatformCommandController {
    getOptions(): Record<string, Options>
    execute(option: any): void
}
