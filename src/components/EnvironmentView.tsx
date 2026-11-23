import { Check, Copy, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import type { ReaDoctorReport } from '../lib/reaTypes';

interface EnvironmentViewProps {
  doctor: ReaDoctorReport | null;
  loading: boolean;
  onRefresh: () => void;
  reaVersion: string;
}

const SETUP_SNIPPETS = [
  {
    id: 'agent-setup',
    title: 'Connect AI Agents (Claude Code, Cursor, Codex, Gemini CLI)',
    command: 'npx rea-agents setup',
    note: 'Registers REA as an MCP server and installs matching reverse-engineering workflow skills with config backups.',
  },
  {
    id: 'doctor',
    title: 'Verify Local Engines & Toolchains',
    command: 'npx rea-agents doctor',
    note: 'Checks Node runtime, Ghidra, Hopper, IDA Pro, JADX, and Kuna availability.',
  },
  {
    id: 'js-cli',
    title: 'Run Static JS / Electron Analysis from Terminal',
    command: 'npx rea-agents analyze-javascript-application /path/to/app --json',
    note: 'No external decompiler needed — reconstructs modules, imports, routes, and Electron IPC boundaries.',
  },
  {
    id: 'mcp-http',
    title: 'Start REA MCP Server (Stdio or Streamable HTTP)',
    command: 'npx rea-agents mcp',
    note: 'Exposes all 263 MCP reverse-engineering tools to any MCP-compatible agent client.',
  },
];

export function EnvironmentView({ doctor, loading, onRefresh, reaVersion }: EnvironmentViewProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1600);
    } catch {
      // ignore
    }
  };

  const counts = doctor?.identity?.catalog?.counts;

  return (
    <div className="space-y-6">
      <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">REA Environment Diagnostics (Doctor)</h1>
            <p className="text-sm text-slate-600 mt-0.5">
              Live output from <span className="font-mono text-xs">rea doctor --json</span> showing built-in capabilities and optional external decompiler engines.
            </p>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-60 whitespace-nowrap"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
            Re-run Doctor
          </button>
        </div>

        {/* Summary Metrics Strip */}
        <dl className="grid grid-cols-2 lg:grid-cols-4 border-b border-slate-200 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 bg-slate-50/60">
          <div className="px-5 py-3.5">
            <dt className="text-xs text-slate-500">Installed Package</dt>
            <dd className="text-base font-semibold text-slate-900 mt-0.5 font-mono tabular-nums">
              rea-agents {doctor?.identity?.cli_package_version ?? reaVersion}
            </dd>
          </div>
          <div className="px-5 py-3.5">
            <dt className="text-xs text-slate-500">CLI Commands</dt>
            <dd className="text-base font-semibold text-slate-900 mt-0.5 font-mono tabular-nums">
              {counts?.cli_commands ?? 204}
            </dd>
          </div>
          <div className="px-5 py-3.5">
            <dt className="text-xs text-slate-500">MCP Tools</dt>
            <dd className="text-base font-semibold text-slate-900 mt-0.5 font-mono tabular-nums">
              {counts?.mcp_tools ?? 263}
            </dd>
          </div>
          <div className="px-5 py-3.5">
            <dt className="text-xs text-slate-500">Static Analyzers</dt>
            <dd className="text-base font-semibold text-emerald-700 mt-0.5">
              18 Built-in Ready
            </dd>
          </div>
        </dl>

        {/* Checks Table */}
        <div className="p-5">
          <h2 className="text-sm font-semibold text-slate-900 mb-3">Host & Optional Engine Checks</h2>
          {loading && !doctor ? (
            <div className="space-y-2">
              <div className="h-9 bg-slate-100 rounded animate-pulse" />
              <div className="h-9 bg-slate-100 rounded animate-pulse" />
              <div className="h-9 bg-slate-100 rounded animate-pulse" />
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-md">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-500">
                    <th className="py-2.5 px-3.5">Component</th>
                    <th className="py-2.5 px-3.5">Status</th>
                    <th className="py-2.5 px-3.5">Detail / Next Step</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr className="bg-emerald-50/40">
                    <td className="py-2.5 px-3.5 font-mono text-xs font-medium text-slate-900 whitespace-nowrap">
                      static-analyzers
                    </td>
                    <td className="py-2.5 px-3.5 text-xs font-semibold text-emerald-700 whitespace-nowrap">
                      Ready
                    </td>
                    <td className="py-2.5 px-3.5 text-xs text-slate-700">
                      Built-in ELF/PE/Mach-O hardening, ELF deps &amp; entropy, JS/Electron graph &amp; fuses, Go, Rust, .NET, Python .pyc, APK signature, Flutter, GGUF/safetensors, and Release Audit run with zero external tools.
                    </td>
                  </tr>
                  {(doctor?.checks ?? []).map((chk) => {
                    const showRemediation = Boolean(chk.remediation && chk.remediation !== chk.detail);
                    return (
                      <tr key={chk.name} className="hover:bg-slate-50/80">
                        <td className="py-2.5 px-3.5 font-mono text-xs font-medium text-slate-900 whitespace-nowrap">
                          {chk.name}
                        </td>
                        <td
                          className={`py-2.5 px-3.5 text-xs font-semibold whitespace-nowrap ${
                            chk.ok
                              ? 'text-emerald-700'
                              : chk.classification === 'missing_analysis_engine'
                                ? 'text-slate-600'
                                : 'text-amber-700'
                          }`}
                        >
                          {chk.ok
                            ? 'Healthy'
                            : chk.classification === 'missing_analysis_engine'
                              ? 'Optional Engine'
                              : 'Notice'}
                        </td>
                        <td className="py-2.5 px-3.5 text-xs text-slate-600 leading-relaxed">
                          {chk.detail && <div className="text-slate-800">{chk.detail}</div>}
                          {showRemediation && <div className="text-slate-500 mt-0.5">{chk.remediation}</div>}
                          {!chk.detail && chk.remediation && <div className="text-slate-700">{chk.remediation}</div>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* Agent MCP Integration Commands */}
      <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200">
          <h2 className="text-base font-semibold text-slate-900">Use REA on Your Own Machine with AI Agents</h2>
          <p className="text-sm text-slate-600 mt-0.5">
            Run these commands on your local workstation to connect REA&apos;s MCP server to Claude Code, Cursor, Codex, or Gemini CLI.
          </p>
        </div>

        <div className="divide-y divide-slate-200">
          {SETUP_SNIPPETS.map((item) => (
            <div key={item.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1 min-w-0">
                <div className="text-sm font-semibold text-slate-900">{item.title}</div>
                <p className="text-xs text-slate-600">{item.note}</p>
                <div className="font-mono text-xs bg-slate-950 text-slate-100 px-3 py-2 rounded-md mt-2 overflow-x-auto">
                  {item.command}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(item.id, item.command)}
                aria-label={`Copy command: ${item.title}`}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 shrink-0 self-start sm:self-center whitespace-nowrap"
              >
                {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedId === item.id ? 'Copied' : 'Copy Command'}
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
