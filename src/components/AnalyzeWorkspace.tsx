import { Clock, FileUp, FolderSearch, Play, Terminal } from 'lucide-react';
import { useState, type ChangeEvent, type FormEvent } from 'react';
import { PRESET_TARGETS, SAMPLE_JS_SNIPPET, WORKBENCH_ANALYZERS } from '../lib/reaCatalog';
import type { AnalysisRunResult, AnalyzerId } from '../lib/reaTypes';
import { EvidenceViewer } from './EvidenceViewer';

type InputMode = 'preset' | 'path' | 'snippet' | 'upload';

interface AnalyzeWorkspaceProps {
  selectedAnalyzer: AnalyzerId;
  onSelectAnalyzer: (id: AnalyzerId) => void;
  targetPath: string;
  onChangeTargetPath: (path: string) => void;
  runs: AnalysisRunResult[];
  activeRunId: string | null;
  onSelectRun: (id: string) => void;
  running: boolean;
  formError: string | null;
  onRunPathAnalysis: (command: AnalyzerId, path: string, label?: string) => Promise<void>;
  onRunSnippetAnalysis: (command: AnalyzerId, filename: string, code: string) => Promise<void>;
  onRunUploadAnalysis: (command: AnalyzerId, file: File) => Promise<void>;
}

export function AnalyzeWorkspace({
  selectedAnalyzer,
  onSelectAnalyzer,
  targetPath,
  onChangeTargetPath,
  runs,
  activeRunId,
  onSelectRun,
  running,
  formError,
  onRunPathAnalysis,
  onRunSnippetAnalysis,
  onRunUploadAnalysis,
}: AnalyzeWorkspaceProps) {
  const [inputMode, setInputMode] = useState<InputMode>('preset');
  const [snippetFilename, setSnippetFilename] = useState('checkout-module.js');
  const [snippetCode, setSnippetCode] = useState(SAMPLE_JS_SNIPPET);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const activeAnalyzer = WORKBENCH_ANALYZERS.find((a) => a.id === selectedAnalyzer) ?? WORKBENCH_ANALYZERS[0];
  const activeRun = runs.find((r) => r.id === activeRunId) ?? runs[0] ?? null;

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setUploadedFile(file);
    setLocalError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (inputMode === 'preset' || inputMode === 'path') {
      if (!targetPath.trim()) {
        setLocalError('Enter an absolute file or directory path to inspect.');
        return;
      }
      await onRunPathAnalysis(selectedAnalyzer, targetPath.trim());
      return;
    }

    if (inputMode === 'snippet') {
      if (!snippetCode.trim()) {
        setLocalError('Paste source code before running analysis.');
        return;
      }
      const cmd: AnalyzerId =
        selectedAnalyzer === 'audit-release-exposure' ? 'audit-release-exposure' : 'analyze-javascript-application';
      await onRunSnippetAnalysis(cmd, snippetFilename.trim() || 'snippet.js', snippetCode);
      return;
    }

    if (inputMode === 'upload') {
      if (!uploadedFile) {
        setLocalError('Choose a local binary, APK, JS bundle, or model file to upload.');
        return;
      }
      await onRunUploadAnalysis(selectedAnalyzer, uploadedFile);
    }
  };

  const handlePresetQuickRun = async (preset: (typeof PRESET_TARGETS)[number]) => {
    setLocalError(null);
    onSelectAnalyzer(preset.recommendedAnalyzer);
    onChangeTargetPath(preset.path);
    await onRunPathAnalysis(preset.recommendedAnalyzer, preset.path, preset.title);
  };

  const displayError = localError || formError;

  return (
    <div className="space-y-6">
      {/* Input & Execution Panel */}
      <section className="bg-white border border-slate-200 rounded-lg">
        <div className="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Static Reverse-Engineering Workbench</h1>
            <p className="text-sm text-slate-600 mt-0.5">
              Run installed <span className="font-mono text-xs text-slate-800">rea-agents</span> static analyzers locally and inspect verifiable Evidence v2 findings.
            </p>
          </div>

          <div className="inline-flex items-center p-0.5 bg-slate-100 rounded-md" role="tablist" aria-label="Target input source">
            {(
              [
                { id: 'preset', label: 'Quick Targets' },
                { id: 'path', label: 'Local Path' },
                { id: 'snippet', label: 'Paste JS Code' },
                { id: 'upload', label: 'Upload File' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={inputMode === tab.id}
                onClick={() => {
                  setInputMode(tab.id);
                  setLocalError(null);
                  if (tab.id === 'snippet' && selectedAnalyzer !== 'analyze-javascript-application' && selectedAnalyzer !== 'audit-release-exposure') {
                    onSelectAnalyzer('analyze-javascript-application');
                  }
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                  inputMode === tab.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {inputMode === 'preset' && (
            <div className="space-y-3">
              <div className="text-xs font-medium text-slate-500">
                Select a ready-to-inspect artifact in this container or click to run immediately
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {PRESET_TARGETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    disabled={running}
                    onClick={() => handlePresetQuickRun(preset)}
                    className="text-left p-4 border border-slate-200 rounded-md hover:border-slate-400 hover:bg-slate-50/70 transition-colors disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-blue-600"
                  >
                    <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                      <span>{preset.category}</span>
                      <span className="font-mono text-blue-700">Run</span>
                    </div>
                    <div className="text-sm font-semibold text-slate-900 mt-1">{preset.title}</div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{preset.subtitle}</p>
                    <div className="font-mono text-[11px] text-slate-500 mt-2 truncate">
                      rea {preset.recommendedAnalyzer} {preset.path}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Analyzer & Target Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
            <div className={inputMode === 'snippet' ? 'lg:col-span-5' : 'lg:col-span-5'}>
              <label htmlFor="analyzer-select" className="block text-xs font-medium text-slate-700 mb-1.5">
                REA Analyzer Command
              </label>
              <select
                id="analyzer-select"
                value={selectedAnalyzer}
                onChange={(e) => onSelectAnalyzer(e.target.value as AnalyzerId)}
                className="w-full h-10 px-3 text-sm bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:border-blue-600"
              >
                {(['Native Binary', 'JavaScript & Release', 'Language & Runtime', 'Mobile & Packages'] as const).map(
                  (group) => (
                    <optgroup key={group} label={group}>
                      {WORKBENCH_ANALYZERS.filter((a) => a.category === group).map((analyzer) => (
                        <option key={analyzer.id} value={analyzer.id}>
                          {analyzer.label} ({analyzer.id})
                        </option>
                      ))}
                    </optgroup>
                  ),
                )}
              </select>
            </div>

            {(inputMode === 'preset' || inputMode === 'path') && (
              <div className="lg:col-span-5">
                <label htmlFor="target-path-input" className="block text-xs font-medium text-slate-700 mb-1.5">
                  Target File or Directory Path
                </label>
                <div className="relative">
                  <FolderSearch className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" aria-hidden="true" />
                  <input
                    id="target-path-input"
                    type="text"
                    value={targetPath}
                    onChange={(e) => onChangeTargetPath(e.target.value)}
                    placeholder="/bin/ls or /app/applet/src"
                    className="w-full h-10 pl-9 pr-3 text-sm font-mono bg-white border border-slate-300 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>
            )}

            {inputMode === 'snippet' && (
              <div className="lg:col-span-5">
                <label htmlFor="snippet-filename-input" className="block text-xs font-medium text-slate-700 mb-1.5">
                  Virtual Filename
                </label>
                <input
                  id="snippet-filename-input"
                  type="text"
                  value={snippetFilename}
                  onChange={(e) => setSnippetFilename(e.target.value)}
                  placeholder="bundle.js"
                  className="w-full h-10 px-3 text-sm font-mono bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>
            )}

            {inputMode === 'upload' && (
              <div className="lg:col-span-5">
                <label htmlFor="artifact-file-input" className="block text-xs font-medium text-slate-700 mb-1.5">
                  Artifact File (ELF, PE, APK, .dll, .js, .gguf, .nupkg — max 25 MB)
                </label>
                <label className="flex items-center gap-2.5 h-10 px-3 border border-slate-300 rounded-md bg-white text-sm text-slate-700 cursor-pointer hover:bg-slate-50">
                  <FileUp className="w-4 h-4 text-slate-500 shrink-0" aria-hidden="true" />
                  <span className="truncate">
                    {uploadedFile ? `${uploadedFile.name} (${Math.round(uploadedFile.size / 1024)} KB)` : 'Choose file to inspect'}
                  </span>
                  <input
                    id="artifact-file-input"
                    type="file"
                    onChange={handleFileChange}
                    className="sr-only"
                  />
                </label>
              </div>
            )}

            <div className="lg:col-span-2">
              <button
                type="submit"
                disabled={running}
                className="w-full h-10 px-4 inline-flex items-center justify-center gap-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-60 transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                <Play className="w-4 h-4" aria-hidden="true" />
                {running ? 'Running…' : 'Run Analysis'}
              </button>
            </div>
          </div>

          {inputMode === 'snippet' && (
            <div>
              <label htmlFor="snippet-code-textarea" className="block text-xs font-medium text-slate-700 mb-1.5">
                JavaScript / TypeScript Code to Reconstruct
              </label>
              <textarea
                id="snippet-code-textarea"
                rows={7}
                value={snippetCode}
                onChange={(e) => setSnippetCode(e.target.value)}
                className="w-full p-3 font-mono text-xs bg-slate-950 text-slate-100 rounded-md border border-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>
          )}

          {/* Active Analyzer Spec Line */}
          <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
            <div>
              <span className="font-medium text-slate-800">{activeAnalyzer.label}:</span>{' '}
              {activeAnalyzer.description}
            </div>
            <div className="font-mono text-[11px] text-slate-500">
              Targets: {activeAnalyzer.supportedTargets}
            </div>
          </div>

          {displayError && (
            <div role="alert" className="p-3 rounded-md bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
              {displayError}
            </div>
          )}
        </form>
      </section>

      {/* Main Output & History Split */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-9 min-w-0">
          {running ? (
            <section className="bg-white border border-slate-200 rounded-lg p-6 space-y-4" aria-busy="true">
              <div className="flex items-center justify-between">
                <div className="h-5 w-56 bg-slate-200 rounded animate-pulse" />
                <div className="h-4 w-24 bg-slate-100 rounded animate-pulse" />
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div className="h-12 bg-slate-100 rounded animate-pulse" />
                <div className="h-12 bg-slate-100 rounded animate-pulse" />
                <div className="h-12 bg-slate-100 rounded animate-pulse" />
                <div className="h-12 bg-slate-100 rounded animate-pulse" />
              </div>
              <div className="space-y-2 pt-2">
                <div className="h-9 bg-slate-100 rounded animate-pulse" />
                <div className="h-9 bg-slate-100 rounded animate-pulse" />
                <div className="h-9 bg-slate-100 rounded animate-pulse" />
              </div>
              <p className="text-xs text-slate-500 font-mono">
                Executing rea {selectedAnalyzer} --json…
              </p>
            </section>
          ) : activeRun ? (
            <EvidenceViewer run={activeRun} />
          ) : (
            <section className="bg-white border border-slate-200 rounded-lg p-8 text-center space-y-3">
              <Terminal className="w-7 h-7 text-slate-400 mx-auto" aria-hidden="true" />
              <h2 className="text-base font-semibold text-slate-900">Ready to Inspect an Artifact</h2>
              <p className="text-sm text-slate-600 max-w-lg mx-auto">
                Pick one of the quick targets above, enter a local file path, paste a JavaScript bundle, or upload a compiled binary to generate a canonical REA Evidence v2 report.
              </p>
            </section>
          )}
        </div>

        {/* Recent Runs History */}
        <aside className="xl:col-span-3 bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Session History</h2>
            <span className="font-mono text-xs text-slate-500 tabular-nums">{runs.length}</span>
          </div>
          {runs.length === 0 ? (
            <div className="p-4 text-xs text-slate-500">
              Completed analyses appear here so you can switch between Evidence reports.
            </div>
          ) : (
            <ul className="divide-y divide-slate-200 max-h-[540px] overflow-y-auto">
              {runs.map((item) => {
                const isSelected = activeRun?.id === item.id;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => onSelectRun(item.id)}
                      className={`w-full text-left px-4 py-3 transition-colors focus-visible:outline-2 focus-visible:outline-blue-600 ${
                        isSelected ? 'bg-slate-100' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-medium text-slate-900 truncate">{item.targetLabel}</span>
                        <span className={item.ok ? 'text-emerald-700 font-medium' : 'text-red-700 font-medium'}>
                          {item.ok ? 'OK' : 'Err'}
                        </span>
                      </div>
                      <div className="font-mono text-[11px] text-slate-500 mt-1 truncate">
                        {item.command}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1 font-mono tabular-nums">
                        <Clock className="w-3 h-3" aria-hidden="true" />
                        <span>{item.durationMs} ms</span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}
