import { Option } from "commander"

export default interface PlatformCommandProvider {
    getOptions(): Option[]
    execute(option: any): void | Promise<void>
}
