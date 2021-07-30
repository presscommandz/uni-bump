import { ArgumentError } from "@model/error"
import semver, { SemVer } from "semver"

export default class ArgumentParser {
    static parseIntOrBooleanArgument(value: string | boolean, _prev: any) {
        if (typeof value === "boolean") {
            return value
        }
        const parsed = Number(value)
        if (isNaN(parsed) || !Number.isInteger(parsed)) {
            throw new ArgumentError("Not a integer")
        }
        return parsed
    }

    static parseVersionArgument(value: string, _prev: any): SemVer {
        const parsed = semver.parse(value)
        if (parsed == null) {
            throw new ArgumentError("Version is invalid")
        }
        return parsed
    }
}
