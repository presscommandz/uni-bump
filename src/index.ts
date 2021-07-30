#!/usr/bin/env node

import path from "path"
import CommandController from "./controller"
import {
    PlatformCommandProvider,
    NodePlatformHandler,
    FastlaneHandler
} from "@platform"
import Platform from "@platform/Platform"

const defaultConfigPath = path.join(process.cwd(), "bumpversion.json")

const handlers = new Map<Platform, PlatformCommandProvider>([
    [Platform.node, new NodePlatformHandler()],
    [Platform.fastlane, new FastlaneHandler()]
])

const controller = new CommandController(defaultConfigPath)

handlers.forEach((handler, platform) =>
    controller.addHandler(platform, handler)
)

controller.execute()
