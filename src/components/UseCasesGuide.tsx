import { ArrowRight } from 'lucide-react';
import type { AnalyzerId } from '../lib/reaTypes';

interface UseCasesGuideProps {
  onTryExample: (analyzer: AnalyzerId, path: string, label: string) => void;
}

interface UseCaseItem {
  number: string;
  title: string;
  category: string;
  whatItDoes: string;
  examples: string[];
  requirements: string;
  tryAction?: {
    label: string;
    analyzer: AnalyzerId;
    path: string;
    runLabel: string;
  };
}

const USE_CASES: UseCaseItem[] = [
  {
    number: '01',
    title: 'Reverse Engineer JavaScript, TypeScript & Electron Apps',
    category: 'Built-in · Ready Now',
    whatItDoes:
      'Statically reconstructs app architecture from minified JS bundles, ASAR archives, or extracted Electron apps without executing them. Maps every module, import/export edge, route, and Electron IPC bridge.',
    examples: [
      'Understand how search, auth, or pricing logic works in a desktop Electron app',
      'Audit shipped web/JS builds for leaked source maps (.map) and debug symbols',
      'Compare two app versions to see exactly which modules and behaviors changed',
    ],
    requirements: 'Zero external tools — runs directly in this workbench.',
    tryAction: {
      label: 'Try on /app/applet/src',
      analyzer: 'analyze-javascript-application',
      path: '/app/applet/src',
      runLabel: 'This App Source (/app/applet/src)',
    },
  },
  {
    number: '02',
    title: 'Inspect Native Binaries (ELF, Windows PE, macOS Mach-O)',
    category: 'Built-in Static + Optional Decompilers',
    whatItDoes:
      'Audits compiled executables for security mitigations (PIE, NX, RELRO, Stack Canaries, Fortify, CFG), shared library dependencies, PE imports/Authenticode certificates, and ELF build notes.',
    examples: [
      'Check if a compiled Linux/Windows/macOS binary is hardened or stripped',
      'Extract exact DLL/SO imports and cryptographic signatures before running unknown binaries',
      'Pair with Ghidra, Hopper, IDA Pro, or Kuna locally for full C pseudocode decompilation and xrefs',
    ],
    requirements: 'Static header/import/hardening inspection works now; decompilation uses Ghidra/Hopper/IDA.',
    tryAction: {
      label: 'Try on /bin/ls',
      analyzer: 'inspect-binary-hardening',
      path: '/bin/ls',
      runLabel: 'Linux ELF Binary (/bin/ls)',
    },
  },
  {
    number: '03',
    title: 'Audit Shipped Releases for Accidental Exposure',
    category: 'Built-in · Ready Now',
    whatItDoes:
      'Scans a release file or build folder to report exactly what an outsider can recover statically — including sibling .map, .pdb, .dSYM, and .debug files left beside production builds.',
    examples: [
      'Pre-release security review before shipping a desktop, web, or CLI app',
      'Verify whether internal endpoints, symbols, or source paths remain recoverable',
    ],
    requirements: 'Zero external tools — runs directly in this workbench.',
    tryAction: {
      label: 'Run Release Audit',
      analyzer: 'audit-release-exposure',
      path: '/app/applet/src',
      runLabel: 'Release Exposure Audit (/app/applet/src)',
    },
  },
  {
    number: '04',
    title: 'Analyze Mobile Apps (Android APK, Flutter, Unity IL2CPP)',
    category: 'Built-in Static + Optional JADX/ADB',
    whatItDoes:
      'Verifies Android APK v1–v3.1 signatures and certificate chains, extracts Flutter Dart snapshot hashes and engine provenance, and decodes Unity global-metadata.dat type/method tables statically.',
    examples: [
      'Upload an .apk file to inspect signing certificates and Flutter ABI libraries',
      'Attach JADX or ADB on your local machine to decompile Java/Kotlin classes and inspect live devices',
    ],
    requirements: 'APK signature, Flutter, and IL2CPP inspection work statically right here.',
  },
  {
    number: '05',
    title: 'Inspect Language Binaries & AI Models (Go, Rust, .NET, Python, GGUF)',
    category: 'Built-in · Ready Now',
    whatItDoes:
      'Extracts embedded build metadata without running the binary: Go module trees, Rust cargo-auditable crates, .NET CIL metadata, PyInstaller CArchives, Deno standalone virtual files, and GGUF/safetensors model headers.',
    examples: [
      'Upload a .gguf or .safetensors file to inspect tensor counts and architecture metadata',
      'Upload a Go, Rust, PyInstaller, Deno, or .NET binary to recover its dependency graph and entry scripts',
    ],
    requirements: 'Zero external tools — upload any supported file in the Workbench tab.',
  },
  {
    number: '06',
    title: 'Connect to AI Coding Agents via MCP (263 Tools)',
    category: 'Agent Integration',
    whatItDoes:
      'Instead of letting an LLM guess how closed-source software works, REA connects Claude Code, Cursor, Codex, or Gemini CLI directly to evidence-backed inspection tools via Model Context Protocol (MCP).',
    examples: [
      'Ask your agent: "Inspect this app, trace how feature X works with evidence, and rebuild a clean version for my codebase"',
      'Every claim is backed by a deterministic SHA-256 Evidence v2 record and explicit limitations',
    ],
    requirements: 'Run `npx rea-agents setup` on your machine (see Doctor & Setup tab).',
  },
];

export function UseCasesGuide({ onTryExample }: UseCasesGuideProps) {
  return (
    <div className="space-y-6">
      <section className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="max-w-3xl space-y-2">
          <div className="text-xs font-medium text-blue-700">Reverse Engineer Anything (morluto/rea)</div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight text-balance">
            What You Can Do with REA
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            REA is an evidence-driven reverse-engineering toolkit and MCP server. You can inspect compiled binaries, JavaScript/Electron apps, Android APKs, .NET/Go/Rust/Python executables, and AI model files without source code — every finding includes byte offsets, SHA-256 hashes, and explicit scope limitations.
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {USE_CASES.map((item) => (
          <article key={item.number} className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col justify-between gap-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                <span className="font-mono font-medium text-slate-400">{item.number}.</span>
                <span>{item.category}</span>
              </div>
              <h2 className="text-base font-semibold text-slate-900">{item.title}</h2>
              <p className="text-sm text-slate-600 leading-relaxed">{item.whatItDoes}</p>
              <ul className="list-disc pl-5 space-y-1 text-xs text-slate-700 leading-relaxed">
                {item.examples.map((ex, i) => (
                  <li key={i}>{ex}</li>
                ))}
              </ul>
            </div>

            <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-slate-500">{item.requirements}</span>
              {item.tryAction && (
                <button
                  type="button"
                  onClick={() =>
                    onTryExample(
                      item.tryAction!.analyzer,
                      item.tryAction!.path,
                      item.tryAction!.runLabel,
                    )
                  }
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-900 whitespace-nowrap"
                >
                  {item.tryAction.label}
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
