import { ArgumentOptions } from "argparse"

export interface Argument {
    flags: string[]
    options?: ArgumentOptions
}

export default interface PlatformCommandProvider {
    getOptions(): Argument[]
    execute(option: any): void | Promise<void>
}
