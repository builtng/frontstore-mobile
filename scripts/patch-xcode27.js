const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, '..', 'node_modules', '@expo', 'cli', 'build', 'src');

function patchFile(filePath, transforms) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  for (const { search, replace } of transforms) {
    if (content.includes(search)) {
      content = content.replace(search, replace);
      changed = true;
    }
  }
  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`[patch-xcode27] Patched ${path.basename(filePath)}`);
  }
}

// 1. SimulatorAppPrerequisite.js
const prereqPath = path.join(baseDir, 'start', 'doctor', 'apple', 'SimulatorAppPrerequisite.js');
if (fs.existsSync(prereqPath)) {
  let content = fs.readFileSync(prereqPath, 'utf8');
  if (!content.includes('DeviceHub')) {
    content = content.replace(
      'return (await (0, _osascript().execAsync)(\'id of app "Simulator"\')).trim();\n    } catch',
      'return (await (0, _osascript().execAsync)(\'id of app "Simulator"\')).trim();\n    } catch {}\n    try {\n        return (await (0, _osascript().execAsync)(\'id of app "DeviceHub"\')).trim();\n    } catch'
    );
    content = content.replace(
      'result !== "com.apple.CoreSimulator.SimulatorTrampoline"',
      'result !== "com.apple.CoreSimulator.SimulatorTrampoline" && result !== "com.apple.dt.Devices"'
    );
    fs.writeFileSync(prereqPath, content, 'utf8');
    console.log('[patch-xcode27] Patched SimulatorAppPrerequisite.js');
  }
}

// 2. ensureSimulatorAppRunning.js
const ensurePath = path.join(baseDir, 'start', 'platforms', 'ios', 'ensureSimulatorAppRunning.js');
if (fs.existsSync(ensurePath)) {
  let content = fs.readFileSync(ensurePath, 'utf8');
  if (!content.includes('DeviceHub')) {
    content = content.replace(
      'async function isSimulatorAppRunningAsync() {',
      `async function isSimulatorAppRunningAsync() {
    try {
        const zeroMeansNo = (await _osascript().execAsync('tell app "System Events" to count processes whose name is "Simulator"')).trim();
        if (zeroMeansNo !== "0") return true;
    } catch {}
    try {
        const zeroMeansNo = (await _osascript().execAsync('tell app "System Events" to count processes whose name is "DeviceHub"')).trim();
        if (zeroMeansNo !== "0") return true;
    } catch {}
    return false;
}
async function _unused_isSimulatorAppRunningAsync() {`
    );
    content = content.replace(
      'await (0, _spawnAsync().default)("open", args);\n}',
      `await (0, _spawnAsync().default)("open", args);
    } catch {
        if (device.udid) {
            await (0, _spawnAsync().default)("open", [\`devices://device/open?id=\${device.udid}\`]);
        } else {
            await (0, _spawnAsync().default)("open", ["-a", "DeviceHub"]);
        }
    }`
    );
    fs.writeFileSync(ensurePath, content, 'utf8');
    console.log('[patch-xcode27] Patched ensureSimulatorAppRunning.js');
  }
}

// 3. AppleDeviceManager.js
const managerPath = path.join(baseDir, 'start', 'platforms', 'ios', 'AppleDeviceManager.js');
if (fs.existsSync(managerPath)) {
  let content = fs.readFileSync(managerPath, 'utf8');
  if (!content.includes('DeviceHub')) {
    content = content.replace(
      'await _osascript().execAsync(`tell application "Simulator" to activate`);',
      `try {
            await _osascript().execAsync(\`tell application "Simulator" to activate\`);
        } catch {
            try {
                await _osascript().execAsync(\`tell application "DeviceHub" to activate\`);
            } catch {}
        }`
    );
    fs.writeFileSync(managerPath, content, 'utf8');
    console.log('[patch-xcode27] Patched AppleDeviceManager.js');
  }
}
