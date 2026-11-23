#!/usr/bin/env node
/**
 * Isolated runner for the installed `rea-agents` CLI compiled runtime.
 * Invokes `dist/cli-runtime/cliOneShot.js` directly so all built-in static
 * analyzers, doctor checks, and help catalogs execute cleanly on the container's
 * Node 22.23.2 runtime with bounded process exit and clean stdout/stderr separation.
 */
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const reaPkgRoot = resolve(__dirname, "../node_modules/rea-agents");
const pkgRaw = await readFile(resolve(reaPkgRoot, "package.json"), "utf8");
const packageJson = JSON.parse(pkgRaw);

const { prepareCliProcessEnvironment } = await import(
  "../node_modules/rea-agents/scripts/lib/cli-process-environment.mjs"
);
prepareCliProcessEnvironment(process.env, process.platform, packageJson.version);

const { runOneShotCli } = await import(
  "../node_modules/rea-agents/dist/cli-runtime/cliOneShot.js"
);

const args = process.argv.slice(2);
let closeCliResources;
let exiting = false;

process.stdout.on("error", (err) => {
  if (err && err.code === "EPIPE") {
    process.exit(0);
  }
});

try {
  await runOneShotCli(args, {
    environment: process.env,
    runtime: {
      packageName: packageJson.name,
      packageVersion: packageJson.version,
      versions: process.versions,
      platform: process.platform,
      architecture: process.arch,
    },
    stdoutIsTerminal: false,
    resultDestination: process.stdout,
    closedStdoutStatus: 141,
    writeStdout: (text) => {
      process.stdout.write(text);
    },
    writeStderr: (text) => {
      process.stderr.write(text);
    },
    stdoutClosed: () => false,
    exitCode: () => (typeof process.exitCode === "number" ? process.exitCode : 0),
    setExitCode: (code) => {
      process.exitCode = code;
    },
    ownCliResources: (close) => {
      closeCliResources = close;
    },
    exitRequested: () => exiting,
    exit: (code, finishOutput) => {
      exiting = true;
      void (async () => {
        try {
          await closeCliResources?.();
        } catch {
          // ignore cleanup errors on shutdown
        }
        try {
          await finishOutput?.();
        } catch {
          // ignore pipe errors on shutdown
        }
        process.exitCode = code;
        setTimeout(() => process.exit(code), 300).unref();
      })();
    },
  });
} finally {
  if (!exiting) {
    try {
      await closeCliResources?.();
    } catch {
      // ignore
    }
  }
}
