import { Check, Copy, Download, FileCode2, TableProperties } from 'lucide-react';
import { useMemo, useState } from 'react';
import { normalizeEvidenceSummary, shortHash } from '../lib/reaParsers';
import type { AnalysisRunResult } from '../lib/reaTypes';

interface EvidenceViewerProps {
  run: AnalysisRunResult;
}

const STATUS_TEXT_CLASS: Record<string, string> = {
  ok: 'text-emerald-700 font-semibold',
  warn: 'text-amber-700 font-semibold',
  error: 'text-red-700 font-semibold',
  neutral: 'text-slate-700 font-medium',
};

export function EvidenceViewer({ run }: EvidenceViewerProps) {
  const [viewMode, setViewMode] = useState<'structured' | 'json'>('structured');
  const [copied, setCopied] = useState(false);

  const summary = useMemo(() => {
    if (!run.evidence) return null;
    return normalizeEvidenceSummary(run.evidence);
  }, [run.evidence]);

  const jsonString = useMemo(() => {
    if (run.evidence) return JSON.stringify(run.evidence, null, 2);
    return run.rawStdout || run.stderr || '';
  }, [run.evidence, run.rawStdout, run.stderr]);

  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard may be unavailable in restricted contexts
    }
  };

  const handleDownloadJson = () => {
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rea-${run.command}-${run.targetLabel.replace(/[^a-zA-Z0-9._-]/g, '_')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!run.ok || !summary) {
    return (
      <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Analysis Returned an Error</h2>
            <p className="text-xs text-slate-500 mt-0.5 font-mono">
              {run.command} · {run.targetPath} · exit {run.exitCode}
            </p>
          </div>
          <span className="text-xs font-medium text-red-700">Failed</span>
        </div>
        <div className="p-5 space-y-3">
          <p className="text-sm text-red-700 font-medium">
            {run.error || 'REA could not parse this target with the selected analyzer.'}
          </p>
          <p className="text-xs text-slate-600">
            Make sure the selected analyzer matches the artifact type (for example, use Binary Hardening or ELF Dependencies on Linux executables, and JavaScript / Electron Analyzer on source directories or JS files).
          </p>
          {(run.stderr || run.rawStdout) && (
            <pre className="p-4 bg-slate-950 text-slate-100 text-xs font-mono rounded-md overflow-x-auto max-h-72">
              {run.stderr || run.rawStdout}
            </pre>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      {/* Header & View Switch */}
      <div className="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>{summary.providerName}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">{run.durationMs} ms</span>
            <span aria-hidden="true">·</span>
            <span>Confidence: {summary.confidence}</span>
          </div>
          <h2 className="text-lg font-semibold text-slate-900 mt-0.5 truncate">
            {run.targetLabel}
          </h2>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="inline-flex items-center p-0.5 bg-slate-100 rounded-md" role="tablist" aria-label="Result view format">
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'structured'}
              onClick={() => setViewMode('structured')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                viewMode === 'structured'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TableProperties className="w-3.5 h-3.5" aria-hidden="true" />
              Structured Evidence
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'json'}
              onClick={() => setViewMode('json')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                viewMode === 'json'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileCode2 className="w-3.5 h-3.5" aria-hidden="true" />
              Raw Evidence JSON
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopyJson}
            aria-label="Copy Evidence JSON"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors whitespace-nowrap"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>

          <button
            type="button"
            onClick={handleDownloadJson}
            aria-label="Download Evidence JSON"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
        </div>
      </div>

      {/* Subject Identity Strip */}
      <dl className="grid grid-cols-2 md:grid-cols-4 border-b border-slate-200 divide-y md:divide-y-0 md:divide-x divide-slate-200 bg-slate-50/60">
        <div className="px-5 py-3">
          <dt className="text-xs text-slate-500">Format / Arch</dt>
          <dd className="text-sm font-medium text-slate-900 mt-0.5 font-mono tabular-nums">
            {summary.format}
            {summary.architecture !== '—' ? ` · ${summary.architecture}` : ''}
          </dd>
        </div>
        <div className="px-5 py-3">
          <dt className="text-xs text-slate-500">Artifact Size</dt>
          <dd className="text-sm font-medium text-slate-900 mt-0.5 font-mono tabular-nums">
            {summary.byteSize}
          </dd>
        </div>
        <div className="px-5 py-3">
          <dt className="text-xs text-slate-500">SHA-256 Digest</dt>
          <dd className="text-sm font-medium text-slate-900 mt-0.5 font-mono tabular-nums truncate" title={summary.sha256}>
            {shortHash(summary.sha256)}
          </dd>
        </div>
        <div className="px-5 py-3">
          <dt className="text-xs text-slate-500">Evidence ID</dt>
          <dd className="text-sm font-medium text-slate-900 mt-0.5 font-mono tabular-nums truncate" title={summary.evidenceId}>
            {shortHash(summary.evidenceId)}
          </dd>
        </div>
      </dl>

      {viewMode === 'json' ? (
        <div className="p-5">
          <pre className="p-4 bg-slate-950 text-slate-100 text-xs leading-relaxed font-mono rounded-md overflow-x-auto max-h-[560px]">
            {jsonString}
          </pre>
        </div>
      ) : (
        <div className="divide-y divide-slate-200">
          {summary.sections.map((section) => (
            <div key={section.title} className="p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">{section.title}</h3>
              <div className="overflow-x-auto border border-slate-200 rounded-md">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-500">
                      <th className="py-2.5 px-3.5">{section.columns[0]}</th>
                      <th className="py-2.5 px-3.5">{section.columns[1]}</th>
                      <th className="py-2.5 px-3.5">{section.columns[2]}</th>
                      {section.rows.some((r) => r.offset) && (
                        <th className="py-2.5 px-3.5 text-right">Offset</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {section.rows.map((row, idx) => (
                      <tr key={`${row.key}-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3.5 font-mono text-xs text-slate-900 font-medium whitespace-nowrap">
                          {row.key}
                        </td>
                        <td className={`py-2.5 px-3.5 text-xs whitespace-nowrap capitalize ${STATUS_TEXT_CLASS[row.status ?? 'neutral']}`}>
                          {row.value}
                        </td>
                        <td className="py-2.5 px-3.5 text-xs text-slate-600 leading-relaxed">
                          {row.detail || '—'}
                        </td>
                        {section.rows.some((r) => r.offset) && (
                          <td className="py-2.5 px-3.5 font-mono text-xs text-slate-500 text-right tabular-nums whitespace-nowrap">
                            {row.offset || '—'}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          {run.progress.length > 0 && (
            <div className="p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-2">
                Execution Trace ({run.progress.length} phases)
              </h3>
              <ol className="text-xs text-slate-600 space-y-1 font-mono">
                {run.progress.slice(-6).map((evt, i) => (
                  <li key={`${evt.phase}-${i}`} className="flex items-center gap-2">
                    <span className="text-slate-400 tabular-nums">
                      {String(evt.sequence ?? i + 1).padStart(2, '0')}.
                    </span>
                    <span className="text-slate-700">{evt.message}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {summary.limitations.length > 0 && (
            <div className="p-5 bg-slate-50/50">
              <h3 className="text-sm font-semibold text-slate-900 mb-2">
                Evidence Scope & Limitations
              </h3>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600 leading-relaxed">
                {summary.limitations.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
