import { execFile } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { isValidAnalyzerId } from '../src/lib/reaCatalog';
import { parseReaHelpCommands, parseReaJsonStream } from '../src/lib/reaParsers';
import type { AnalysisRunResult, ReaCommandItem, ReaDoctorReport } from '../src/lib/reaTypes';

const execFileAsync = promisify(execFile);

const RUNNER_PATH = path.resolve(process.cwd(), 'scripts/rea-runner.mjs');
const EXEC_TIMEOUT_MS = 25_000;
const MAX_BUFFER = 16 * 1024 * 1024;

let cachedCommands: ReaCommandItem[] | null = null;
let cachedDoctor: ReaDoctorReport | null = null;
let cachedVersion: string | null = null;

async function execRea(args: string[]): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  try {
    const { stdout, stderr } = await execFileAsync(process.execPath, [RUNNER_PATH, ...args], {
      cwd: process.cwd(),
      timeout: EXEC_TIMEOUT_MS,
      maxBuffer: MAX_BUFFER,
      env: { ...process.env, NO_COLOR: '1' },
    });
    return { stdout, stderr, exitCode: 0 };
  } catch (err: unknown) {
    const e = err as { stdout?: string; stderr?: string; code?: number | string; message?: string };
    return {
      stdout: typeof e.stdout === 'string' ? e.stdout : '',
      stderr: typeof e.stderr === 'string' ? e.stderr : e.message ?? 'REA command failed',
      exitCode: typeof e.code === 'number' ? e.code : 1,
    };
  }
}

export async function getReaVersion(): Promise<string> {
  if (cachedVersion) return cachedVersion;
  try {
    const pkgPath = path.resolve(process.cwd(), 'node_modules/rea-agents/package.json');
    const raw = await fs.readFile(pkgPath, 'utf8');
    const parsed = JSON.parse(raw) as { version?: string };
    cachedVersion = parsed.version ?? '6.10.1';
    return cachedVersion;
  } catch {
    return '6.10.1';
  }
}

export async function getReaCommands(): Promise<ReaCommandItem[]> {
  if (cachedCommands) return cachedCommands;
  const { stdout } = await execRea(['--help']);
  const parsed = parseReaHelpCommands(stdout);
  if (parsed.length > 0) {
    cachedCommands = parsed;
  }
  return parsed;
}

export async function getReaDoctor(forceRefresh = false): Promise<ReaDoctorReport> {
  if (cachedDoctor && !forceRefresh) return cachedDoctor;
  const { stdout } = await execRea(['doctor', '--json']);
  const { evidence } = parseReaJsonStream(stdout);
  if (evidence && typeof evidence === 'object') {
    cachedDoctor = evidence as unknown as ReaDoctorReport;
    return cachedDoctor;
  }
  return {
    healthy: false,
    environment_healthy: false,
    checks: [],
    providerInspections: [],
  };
}

/**
 * Validates that a user-supplied local path is non-empty, absolute, has no null bytes,
 * and actually exists on disk before passing it to REA.
 */
async function validateExistingPath(targetPath: string): Promise<string> {
  const cleaned = targetPath.trim();
  if (!cleaned || cleaned.includes('\0')) {
    throw new Error('Please provide a valid file or directory path.');
  }
  const resolved = path.resolve(cleaned);
  await fs.access(resolved);
  return resolved;
}

export async function runReaAnalysis(
  command: string,
  targetPath: string,
  targetLabel?: string,
): Promise<AnalysisRunResult> {
  if (!isValidAnalyzerId(command)) {
    throw new Error(`Analyzer "${command}" is not enabled in the static workbench allowlist.`);
  }

  const resolvedPath = await validateExistingPath(targetPath);
  const startedAt = Date.now();
  const { stdout, stderr, exitCode } = await execRea([command, resolvedPath, '--json']);
  const durationMs = Date.now() - startedAt;

  const { evidence, progress } = parseReaJsonStream(stdout);

  // Some REA commands emit structured JSON errors on stdout/stderr when target format mismatches
  const errorText =
    exitCode !== 0
      ? stderr.trim() ||
        (evidence && typeof (evidence as Record<string, unknown>).error === 'string'
          ? String((evidence as Record<string, unknown>).error)
          : stdout.trim().slice(0, 500) || `REA exited with code ${exitCode}`)
      : undefined;

  return {
    id: randomUUID(),
    command,
    targetLabel: targetLabel || path.basename(resolvedPath) || resolvedPath,
    targetPath: resolvedPath,
    timestamp: new Date().toISOString(),
    durationMs,
    exitCode,
    ok: exitCode === 0 && evidence !== null,
    evidence,
    progress,
    rawStdout: stdout.slice(0, 250_000),
    stderr: stderr.slice(0, 20_000),
    error: errorText,
  };
}

export async function runReaOnUploadedBuffer(
  command: string,
  originalName: string,
  buffer: Buffer,
): Promise<AnalysisRunResult> {
  if (!isValidAnalyzerId(command)) {
    throw new Error(`Analyzer "${command}" is not supported for uploaded artifacts.`);
  }
  const safeFileName = path.basename(originalName || 'artifact.bin').replace(/[^a-zA-Z0-9._-]/g, '_');
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'rea-wb-'));
  const filePath = path.join(tempDir, safeFileName);
  try {
    await fs.writeFile(filePath, buffer);
    // For directory-oriented JS analyzer on a single uploaded file, analyze the temp folder containing that file
    const target = command === 'analyze-javascript-application' ? tempDir : filePath;
    const result = await runReaAnalysis(command, target, safeFileName);
    return {
      ...result,
      targetPath: `upload://${safeFileName}`,
    };
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => undefined);
  }
}

export async function runReaOnCodeSnippet(
  command: string,
  filename: string,
  code: string,
): Promise<AnalysisRunResult> {
  if (!code.trim()) {
    throw new Error('Code snippet cannot be empty.');
  }
  const safeFileName = path
    .basename(filename.trim() || 'snippet.js')
    .replace(/[^a-zA-Z0-9._-]/g, '_');
  const finalName = /\.[a-z0-9]+$/i.test(safeFileName) ? safeFileName : `${safeFileName}.js`;
  return runReaOnUploadedBuffer(command, finalName, Buffer.from(code, 'utf8'));
}
