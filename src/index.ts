#!/usr/bin/env node

import path from "path"
import CommandController from "./Controller"
import {
    BumpProvider,
    AppleGenericVersioningProvider,
    NodePlatformHandler,
    FastlaneHandler
} from "@platform"

const defaultConfigPath = path.join(process.cwd(), "bumpversion.json")

const handlers = new Map<BumpProvider.Provider, BumpProvider>([
    [BumpProvider.Provider.node, new NodePlatformHandler()],
    [BumpProvider.Provider.fastlane, new FastlaneHandler()],
    [BumpProvider.Provider.agvtool, new AppleGenericVersioningProvider()]
])

const controller = new CommandController(defaultConfigPath)

handlers.forEach((handler, platform) =>
    controller.addHandler(platform, handler)
)

controller.execute()
