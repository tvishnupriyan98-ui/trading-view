import { Check, Copy, Play, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { AnalyzerId, ReaCommandItem } from '../lib/reaTypes';

interface CommandCatalogProps {
  commands: ReaCommandItem[];
  loading: boolean;
  onLaunchAnalyzer: (analyzerId: AnalyzerId) => void;
}

export function CommandCatalog({ commands, loading, onLaunchAnalyzer }: CommandCatalogProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [runnableOnly, setRunnableOnly] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const cmd of commands) {
      counts.set(cmd.category, (counts.get(cmd.category) ?? 0) + 1);
    }
    return ['All', ...Array.from(counts.keys()).sort()];
  }, [commands]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return commands.filter((cmd) => {
      if (selectedCategory !== 'All' && cmd.category !== selectedCategory) return false;
      if (runnableOnly && !cmd.runnableInWorkbench) return false;
      if (!q) return true;
      return (
        cmd.name.toLowerCase().includes(q) ||
        cmd.description.toLowerCase().includes(q) ||
        cmd.category.toLowerCase().includes(q)
      );
    });
  }, [commands, search, selectedCategory, runnableOnly]);

  const handleCopy = async (name: string) => {
    try {
      await navigator.clipboard.writeText(`npx rea-agents ${name} --help`);
      setCopiedCmd(name);
      setTimeout(() => setCopiedCmd(null), 1600);
    } catch {
      // ignore clipboard errors
    }
  };

  return (
    <div className="space-y-5">
      <section className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Installed REA CLI & MCP Command Catalog</h1>
            <p className="text-sm text-slate-600 mt-0.5">
              Live command inventory parsed directly from the installed <span className="font-mono text-xs">rea-agents</span> binary.
            </p>
          </div>
          <div className="text-xs text-slate-500 font-mono tabular-nums">
            Showing {filtered.length} of {commands.length} commands
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" aria-hidden="true" />
            <label htmlFor="command-search" className="sr-only">
              Filter REA commands
            </label>
            <input
              id="command-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search commands (e.g. elf, javascript, apk, ghidra, model, sqlite)…"
              className="w-full h-9 pl-9 pr-3 text-sm bg-white border border-slate-300 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
            />
          </div>

          <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={runnableOnly}
              onChange={(e) => setRunnableOnly(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-600"
            />
            Static workbench-ready only
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 pt-1" role="tablist" aria-label="Command categories">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              role="tab"
              aria-selected={selectedCategory === cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            <div className="h-9 bg-slate-100 rounded animate-pulse" />
            <div className="h-9 bg-slate-100 rounded animate-pulse" />
            <div className="h-9 bg-slate-100 rounded animate-pulse" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            No REA commands match &ldquo;{search}&rdquo;. Try clearing your search filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-500">
                  <th className="py-2.5 px-4">Command</th>
                  <th className="py-2.5 px-4">Domain</th>
                  <th className="py-2.5 px-4">Capability</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filtered.map((cmd) => (
                  <tr key={cmd.name} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-4 font-mono text-xs font-medium text-slate-900 whitespace-nowrap">
                      {cmd.name}
                    </td>
                    <td className="py-2.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                      {cmd.category}
                    </td>
                    <td className="py-2.5 px-4 text-xs text-slate-700 leading-relaxed max-w-xl">
                      {cmd.description}
                    </td>
                    <td className="py-2.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        {cmd.runnableInWorkbench && (
                          <button
                            type="button"
                            onClick={() => onLaunchAnalyzer(cmd.name as AnalyzerId)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-700 hover:text-blue-900 hover:bg-blue-50 rounded transition-colors"
                          >
                            <Play className="w-3 h-3" aria-hidden="true" />
                            Run
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleCopy(cmd.name)}
                          aria-label={`Copy CLI command for ${cmd.name}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                        >
                          {copiedCmd === cmd.name ? (
                            <Check className="w-3 h-3 text-emerald-700" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          {copiedCmd === cmd.name ? 'Copied' : 'CLI'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
