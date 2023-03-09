const colors = require("chalk");
const path = require("path");

const ROOT_FOLDER = path.resolve(__dirname, "../..");

module.exports.ROOT_FOLDER = ROOT_FOLDER;

const fs = require("fs");

const INCLUDE_REGEX = /^#\s*include\s+["<](.+)[">]/;
const ROARING_VERSION = /#\s*define\s+ROARING_VERSION\s+"(.+)"/;

const SRC_CPP_FOLDER = path.resolve(ROOT_FOLDER, "src/cpp");

module.exports.SRC_CPP_FOLDER = SRC_CPP_FOLDER;

const OUTPUT_FILE_PATH = path.resolve(ROOT_FOLDER, "roaring-node.cpp");

module.exports.OUTPUT_FILE_PATH = OUTPUT_FILE_PATH;

const BINARY_OUTPUT_FILE_PATH = path.resolve(ROOT_FOLDER, "build/Release/roaring.node");

module.exports.BINARY_OUTPUT_FILE_PATH = BINARY_OUTPUT_FILE_PATH;

module.exports.unity = function unity() {
  const existsCache = new Map();

  const exists = (filePath) => {
    let result = existsCache.get(filePath);
    if (result !== undefined) {
      return result;
    }
    result = fs.existsSync(filePath);
    existsCache.set(filePath, result);
    return result;
  };

  const includedFiles = new Set();
  let roaringVersion = null;

  const output = ['// This file is generated by "scripts/build.js". Do not edit it directly.', ""];

  function processFile(filePath) {
    const content = fs.readFileSync(filePath, "utf8");
    for (const line of content.split("\n")) {
      const includeMatch = line.match(INCLUDE_REGEX);
      if (includeMatch) {
        const includePath = path.resolve(path.dirname(filePath), includeMatch[1]);
        if (exists(includePath)) {
          if (!includedFiles.has(includePath)) {
            output.push(`\n// ${line}\n`);
            includedFiles.add(includePath);
            processFile(includePath);
          }
          continue;
        }
      } else if (!roaringVersion) {
        const match = line.match(ROARING_VERSION);
        if (match) {
          roaringVersion = match[1];
          if (!/^[0-9]+\.[0-9]+\.[0-9]+$/.test(roaringVersion)) {
            throw new Error(`Invalid roaring version ${roaringVersion}`);
          }
        }
      }
      output.push(line);
    }
  }

  processFile(path.resolve(SRC_CPP_FOLDER, "main.cpp"));

  console.log();
  console.log(colors.cyan(`- roaring version ${roaringVersion}`));

  const outputText = output.join("\n");
  console.log(colors.cyanBright(`- ${includedFiles.size} files included. ${outputText.length} bytes total.`));

  return {
    roaringVersion,
    outputText,
  };
};