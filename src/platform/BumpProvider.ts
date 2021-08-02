import type { ArgumentOptions } from "argparse"

export interface Argument {
    flags: string[]
    options?: ArgumentOptions
}

namespace BumpProvider {
    export const enum Provider {
        node = "node",
        fastlane = "fastlane",
        agvtool = "agvtool"
    }
}

interface BumpProvider {
    getOptions(): Argument[]
    execute(option: any): void | Promise<void>
}

export default BumpProvider
