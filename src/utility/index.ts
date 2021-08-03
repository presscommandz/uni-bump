import BumpSwitchType from "@model/BumpSwitchTypes"
import VersionType from "@model/BumpTypes"

export default class Utility {
    static getVersionTypeFromSwitch(
        switchOption: BumpSwitchType
    ): VersionType | null {
        switch (switchOption) {
            case BumpSwitchType.major:
                return VersionType.major
            case BumpSwitchType.minor:
                return VersionType.minor
            case BumpSwitchType.patch:
                return VersionType.patch
            case BumpSwitchType.build:
                return VersionType.build
            default:
                return null
        }
    }
}
