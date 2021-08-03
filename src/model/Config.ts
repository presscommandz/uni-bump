interface FastlaneConfig {
    xcodeproj?: string
}

export default interface Config {
    provider?: string
    providerConfig?: {
        fastlane?: FastlaneConfig
    }
}
