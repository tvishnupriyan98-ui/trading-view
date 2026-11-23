import type { AnalyzerDefinition, AnalyzerId, PresetTarget } from './reaTypes';

export const WORKBENCH_ANALYZERS: AnalyzerDefinition[] = [
  {
    id: 'inspect-binary-hardening',
    label: 'Binary Hardening Audit',
    category: 'Native Binary',
    description: 'Inspects ELF, PE, and Mach-O security flags: PIE, NX, RELRO, Stack Protector, Fortify, CET, and symbol stripping.',
    supportedTargets: 'ELF, PE (.exe/.dll), Mach-O binaries',
    targetKind: 'file',
  },
  {
    id: 'inspect-elf-dependencies',
    label: 'ELF Dependencies & Imports',
    category: 'Native Binary',
    description: 'Extracts DT_NEEDED shared libraries, SONAME, RPATH/RUNPATH, GNU symbol versions, and undefined dynamic imports.',
    supportedTargets: 'Linux ELF binaries & shared libraries (.so)',
    targetKind: 'file',
  },
  {
    id: 'inspect-elf-notes',
    label: 'ELF Notes & Build IDs',
    category: 'Native Binary',
    description: 'Reads PT_NOTE / SHT_NOTE sections including GNU Build-ID, ABI tags, and compiler note metadata.',
    supportedTargets: 'Linux ELF binaries',
    targetKind: 'file',
  },
  {
    id: 'inspect-byte-entropy',
    label: 'Byte Entropy & Packing Scan',
    category: 'Native Binary',
    description: 'Computes Shannon entropy windows across a binary to detect packed, compressed, or encrypted regions.',
    supportedTargets: 'Any binary, firmware image, or archive',
    targetKind: 'file',
  },
  {
    id: 'analyze-javascript-application',
    label: 'JavaScript / Electron Analyzer',
    category: 'JavaScript & Release',
    description: 'Statically reconstructs JS/TS/Electron modules, imports, exports, semantic relationships, and Electron IPC boundaries.',
    supportedTargets: 'JS/TS source folders, bundles, extracted Electron apps or ASARs',
    targetKind: 'either',
  },
  {
    id: 'audit-release-exposure',
    label: 'Release Exposure Audit',
    category: 'JavaScript & Release',
    description: 'Reports what static analysis recovers from a shipped artifact, including sibling .map, .pdb, .dSYM, and .debug companions.',
    supportedTargets: 'Any shipped binary, bundle, or release folder',
    targetKind: 'either',
  },
  {
    id: 'inspect-electron-fuses',
    label: 'Electron Security Fuses',
    category: 'JavaScript & Release',
    description: 'Reads embedded Electron fuse wire flags (ASAR integrity, RunAsNode, cookie encryption, Node CLI inspect).',
    supportedTargets: 'Electron executables and app binaries',
    targetKind: 'file',
  },
  {
    id: 'inspect-desktop-application',
    label: 'Desktop Application Scanner',
    category: 'JavaScript & Release',
    description: 'Scans an application directory for runtime candidates (Electron, .NET, JVM, native), supporting files, and next probes.',
    supportedTargets: 'Application installation directories',
    targetKind: 'directory',
  },
  {
    id: 'inspect-go-binary',
    label: 'Go Build Info Inspector',
    category: 'Language & Runtime',
    description: 'Extracts embedded Go compiler version, module paths, dependency versions, replacements, and build settings.',
    supportedTargets: 'Compiled Go ELF, PE, or Mach-O binaries',
    targetKind: 'file',
  },
  {
    id: 'inspect-rust-binary',
    label: 'Rust Crate Dependency Audit',
    category: 'Language & Runtime',
    description: 'Reads embedded cargo-auditable crate names, versions, sources, and dependency edges from compiled Rust binaries.',
    supportedTargets: 'Rust ELF, PE, Mach-O, or WASM binaries',
    targetKind: 'file',
  },
  {
    id: 'inspect-pe-imports',
    label: 'PE Import Table Inspector',
    category: 'Native Binary',
    description: 'Parses Windows PE import and delay-load DLLs, ordinals, IAT RVAs, and computes pefile import hash (imphash).',
    supportedTargets: 'Windows .exe, .dll, .sys files',
    targetKind: 'file',
  },
  {
    id: 'inspect-pe-certificates',
    label: 'PE Authenticode Certificates',
    category: 'Native Binary',
    description: 'Inspects Authenticode WIN_CERTIFICATE entries and PKCS#7 signer and X.509 certificate identity fields.',
    supportedTargets: 'Signed Windows PE executables',
    targetKind: 'file',
  },
  {
    id: 'inspect-managed-artifact',
    label: '.NET Managed Artifact Inspector',
    category: 'Language & Runtime',
    description: 'Statically reads .NET assembly metadata, types, methods, CIL headers, and declared native P/Invoke dependencies.',
    supportedTargets: '.NET .dll and .exe assemblies',
    targetKind: 'file',
  },
  {
    id: 'inspect-python-pyc',
    label: 'Python Bytecode (.pyc) Inspector',
    category: 'Language & Runtime',
    description: 'Decodes CPython .pyc header magic, version, code objects, constants, and bytecode disassembly statically.',
    supportedTargets: 'Compiled Python .pyc files',
    targetKind: 'file',
  },
  {
    id: 'inspect-apk-signature',
    label: 'Android APK Signature Audit',
    category: 'Mobile & Packages',
    description: 'Verifies APK v1/v2/v3/v3.1 signers, certificate SHA-256 fingerprints, key rotation, and digest self-consistency.',
    supportedTargets: 'Android .apk packages',
    targetKind: 'file',
  },
  {
    id: 'identify-flutter-build',
    label: 'Flutter Build Provenance',
    category: 'Mobile & Packages',
    description: 'Extracts Dart snapshot hashes, per-ABI native library digests, and Flutter engine build provenance from APKs.',
    supportedTargets: 'Flutter Android .apk packages',
    targetKind: 'file',
  },
  {
    id: 'inspect-model-artifact',
    label: 'ML Model Artifact Inspector',
    category: 'Mobile & Packages',
    description: 'Parses GGUF and safetensors headers, model architecture metadata, tensor declarations, and parameter totals.',
    supportedTargets: '.gguf and .safetensors files',
    targetKind: 'file',
  },
  {
    id: 'inspect-nuget-nupkg',
    label: 'NuGet Package Inspector',
    category: 'Mobile & Packages',
    description: 'Inspects .nupkg identity, target frameworks, dependency groups, license/repository fields, and archive contents.',
    supportedTargets: '.nupkg archives',
    targetKind: 'file',
  },
];

export const RUNNABLE_ANALYZER_IDS = new Set<string>(WORKBENCH_ANALYZERS.map((a) => a.id));

export const PRESET_TARGETS: PresetTarget[] = [
  {
    id: 'elf-ls',
    title: 'Linux ELF Binary (/bin/ls)',
    subtitle: 'x86_64 native executable — check PIE, NX, RELRO, Stack Protector, and symbol stripping',
    path: '/bin/ls',
    recommendedAnalyzer: 'inspect-binary-hardening',
    category: 'Native Binary',
  },
  {
    id: 'elf-ls-deps',
    title: 'ELF Shared Libraries (/bin/ls)',
    subtitle: 'Inspect dynamic library imports, SONAME, GNU symbol versions, and undefined symbols',
    path: '/bin/ls',
    recommendedAnalyzer: 'inspect-elf-dependencies',
    category: 'Native Binary',
  },
  {
    id: 'elf-ls-entropy',
    title: 'Binary Byte Entropy (/bin/ls)',
    subtitle: 'Scan Shannon entropy windows across /bin/ls to spot compressed or high-entropy regions',
    path: '/bin/ls',
    recommendedAnalyzer: 'inspect-byte-entropy',
    category: 'Native Binary',
  },
  {
    id: 'js-workbench-src',
    title: 'This App Source (/app/applet/src)',
    subtitle: 'Reconstruct TypeScript/React module graph, imports, exports, and semantic edges',
    path: '/app/applet/src',
    recommendedAnalyzer: 'analyze-javascript-application',
    category: 'JavaScript & TS',
  },
  {
    id: 'release-audit-src',
    title: 'Release Exposure Audit (/app/applet/src)',
    subtitle: 'Audit shipped directory for recoverable modules, debug companions, and exposed symbols',
    path: '/app/applet/src',
    recommendedAnalyzer: 'audit-release-exposure',
    category: 'Release Audit',
  },
  {
    id: 'node-runtime-elf',
    title: 'Node.js Runtime (/usr/local/bin/node)',
    subtitle: 'Inspect the container Node.js ELF binary hardening profile and build notes',
    path: '/usr/local/bin/node',
    recommendedAnalyzer: 'inspect-binary-hardening',
    category: 'Native Binary',
  },
];

export function isValidAnalyzerId(id: string): id is AnalyzerId {
  return RUNNABLE_ANALYZER_IDS.has(id);
}

export const SAMPLE_JS_SNIPPET = `// Example minified checkout & feature-flag module for static reverse engineering
const API_BASE = "https://api.example-store.internal/v2";
const FEATURE_FLAGS = { betaPricing: true, telemetrySync: false };

export async function verifyLicenseToken(token, deviceFingerprint) {
  const payload = { token: token.trim(), fp: deviceFingerprint, flags: FEATURE_FLAGS };
  const res = await fetch(\`\${API_BASE}/license/verify\`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Client-Build": "4.2.1" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(\`Verification rejected (\${res.status})\`);
  return res.json();
}

export function computeDiscountTier(subtotalCents, couponCode) {
  if (couponCode === "FOUNDER40" && subtotalCents >= 5000) {
    return Math.round(subtotalCents * 0.4);
  }
  return subtotalCents >= 10000 ? Math.round(subtotalCents * 0.15) : 0;
}
`;
