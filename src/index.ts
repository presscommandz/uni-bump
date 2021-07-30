#!/usr/bin/env node

import path from "path"
import CommandController from "./controller"
import {
    PlatformCommandProvider,
    NodePlatformHandler,
    FastlaneHandler
} from "./platform"

const defaultConfigPath = path.join(process.cwd(), "bumpversion.json")

const handlers: Record<string, PlatformCommandProvider> = {
    node: new NodePlatformHandler(),
    fastlane: new FastlaneHandler()
}

const controller = new CommandController(defaultConfigPath)

Object.entries(handlers).forEach(([platform, handler]) =>
    controller.addHandler(platform, handler)
)

controller.execute()
