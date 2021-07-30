#!/usr/bin/env node

import path from "path"
import CommandController from "./Controller"
import {
    PlatformCommandProvider,
    AppleGenericVersioningProvider,
    NodePlatformHandler,
    FastlaneHandler
} from "@platform"
import Platform from "@platform/Platform"

const defaultConfigPath = path.join(process.cwd(), "bumpversion.json")

const handlers = new Map<Platform, PlatformCommandProvider>([
    [Platform.node, new NodePlatformHandler()],
    [Platform.fastlane, new FastlaneHandler()],
    [Platform.agvtool, new AppleGenericVersioningProvider()]
])

const controller = new CommandController(defaultConfigPath)

handlers.forEach((handler, platform) =>
    controller.addHandler(platform, handler)
)

controller.execute()
