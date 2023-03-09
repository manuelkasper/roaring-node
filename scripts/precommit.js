#!/usr/bin/env node

const { execSync } = require("child_process");

const nodeVersion = parseInt(process.versions.node.split(".")[0], 10);
if (nodeVersion >= 14) {
  execSync("npx lint-staged");
}

execSync("npx pretty-quick --staged");