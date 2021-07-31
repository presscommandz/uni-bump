import type { ArgumentOptions } from "argparse"

export interface Argument {
    flags: string[]
    options?: ArgumentOptions
}

export default interface BumpProvider {
    getOptions(): Argument[]
    execute(option: any): void | Promise<void>
}
