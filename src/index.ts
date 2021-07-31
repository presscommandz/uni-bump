#!/usr/bin/env node

import path from "path"
import CommandController from "./Controller"
import {
    PlatformCommandProvider,
    AppleGenericVersioningProvider,
    NodePlatformHandler,
    FastlaneHandler
} from "@platform"
import Provider from "@platform/Provider"

const defaultConfigPath = path.join(process.cwd(), "bumpversion.json")

const handlers = new Map<Provider, PlatformCommandProvider>([
    [Provider.node, new NodePlatformHandler()],
    [Provider.fastlane, new FastlaneHandler()],
    [Provider.agvtool, new AppleGenericVersioningProvider()]
])

const controller = new CommandController(defaultConfigPath)

handlers.forEach((handler, platform) =>
    controller.addHandler(platform, handler)
)

controller.execute()
