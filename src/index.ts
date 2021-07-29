#!/usr/bin/env node

import path from "path"
import CommandController from "./controller"
import { NodePlatformHandler } from "./platform"
import pkg from "../package.json"

const defaultConfigPath = path.join(process.cwd(), "bumpversion.json")

const controller = new CommandController(defaultConfigPath)
controller.addHandler("node", new NodePlatformHandler())

controller.execute()
