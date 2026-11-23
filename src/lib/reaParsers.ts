import { RUNNABLE_ANALYZER_IDS } from './reaCatalog';
import type {
  NormalizedEvidenceSummary,
  NormalizedFindingRow,
  NormalizedSection,
  ReaCommandItem,
  ReaEvidenceEnvelope,
  ReaProgressEvent,
} from './reaTypes';

/**
 * Classifies a REA CLI command into a human-friendly domain group.
 */
export function classifyCommandCategory(name: string): string {
  const n = name.toLowerCase();
  const tokens = new Set(n.split('-'));
  if (
    n.includes('javascript') ||
    n.includes('electron') ||
    tokens.has('web') ||
    n.includes('browser') ||
    tokens.has('har') ||
    tokens.has('saz') ||
    n.includes('release-exposure')
  ) {
    return 'JavaScript, Electron & Web';
  }
  if (
    n.includes('adb') ||
    n.includes('apk') ||
    n.includes('android') ||
    n.includes('flutter') ||
    n.includes('jadx') ||
    n.includes('apktool') ||
    n.includes('jeb')
  ) {
    return 'Android & Mobile';
  }
  if (
    n.includes('elf') ||
    n.includes('pe-') ||
    n.includes('binary') ||
    n.includes('native') ||
    n.includes('ghidra') ||
    n.includes('hopper') ||
    n.includes('ida') ||
    n.includes('kuna') ||
    n.includes('dwarf') ||
    n.includes('xref') ||
    n.includes('disassem') ||
    n.includes('decompil') ||
    n.includes('function') ||
    n.includes('address') ||
    n.includes('crash') ||
    n.includes('kernel') ||
    n.includes('macho') ||
    n.includes('apple') ||
    n.includes('gpu') ||
    n.includes('objdump') ||
    n.includes('rizin')
  ) {
    return 'Native Binaries & Decompilers';
  }
  if (
    n.includes('dotnet') ||
    n.includes('managed') ||
    n.includes('nuget') ||
    n.includes('il2cpp') ||
    n.includes('go-') ||
    n.includes('rust') ||
    n.includes('pyinstaller') ||
    n.includes('deno') ||
    n.includes('erlang') ||
    n.includes('wasm') ||
    n.includes('evm') ||
    n.includes('godot')
  ) {
    return 'Managed, Language & Bytecode';
  }
  if (
    n.includes('firmware') ||
    n.includes('packet') ||
    n.includes('pcap') ||
    n.includes('signal') ||
    n.includes('sqlite') ||
    n.includes('model') ||
    n.includes('shortcut')
  ) {
    return 'Firmware, Network & Data';
  }
  return 'Workflow, Evidence & MCP';
}

/**
 * Parses `rea --help` output into structured command items.
 */
export function parseReaHelpCommands(helpText: string): ReaCommandItem[] {
  const lines = helpText.split(/\r?\n/);
  const items: ReaCommandItem[] = [];
  let inCommands = false;

  for (const line of lines) {
    if (/^Commands:\s*$/.test(line.trim())) {
      inCommands = true;
      continue;
    }
    if (inCommands && /^[A-Z][A-Za-z ]+:\s*$/.test(line.trim())) {
      inCommands = false;
      continue;
    }
    if (!inCommands) continue;

    const match = line.match(/^ {2}([a-z0-9][a-z0-9-]*)\s{2,}(.+)$/);
    if (match) {
      const name = match[1].trim();
      const description = match[2].trim();
      items.push({
        name,
        description,
        category: classifyCommandCategory(name),
        runnableInWorkbench: RUNNABLE_ANALYZER_IDS.has(name),
      });
    }
  }
  return items;
}

/**
 * Extracts progress NDJSON objects and the final Evidence JSON payload from REA stdout.
 * REA commands like `analyze-javascript-application --json` may stream multiple
 * `{"rea_progress": ...}` JSON objects concatenated before the final Evidence object.
 */
export function parseReaJsonStream(stdout: string): {
  evidence: ReaEvidenceEnvelope | null;
  progress: ReaProgressEvent[];
} {
  const progress: ReaProgressEvent[] = [];
  let evidence: ReaEvidenceEnvelope | null = null;

  const trimmed = stdout.trim();
  if (!trimmed) {
    return { evidence, progress };
  }

  // Fast path: single clean JSON object
  try {
    const parsed = JSON.parse(trimmed) as Record<string, unknown>;
    if (parsed && typeof parsed === 'object') {
      if ('rea_progress' in parsed && parsed.rea_progress && typeof parsed.rea_progress === 'object') {
        progress.push(parsed.rea_progress as ReaProgressEvent);
      } else {
        evidence = parsed as ReaEvidenceEnvelope;
      }
      return { evidence, progress };
    }
  } catch {
    // Fall through to multi-object JSON scanner
  }

  // Balanced-brace scanner for concatenated JSON objects (with string/escape handling)
  let depth = 0;
  let inString = false;
  let escaped = false;
  let startIdx = -1;

  for (let i = 0; i < trimmed.length; i++) {
    const ch = trimmed[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }

    if (ch === '{') {
      if (depth === 0) startIdx = i;
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0 && startIdx !== -1) {
        const slice = trimmed.slice(startIdx, i + 1);
        startIdx = -1;
        try {
          const obj = JSON.parse(slice) as Record<string, unknown>;
          if (obj && typeof obj === 'object') {
            if ('rea_progress' in obj && obj.rea_progress && typeof obj.rea_progress === 'object') {
              progress.push(obj.rea_progress as ReaProgressEvent);
            } else {
              evidence = obj as ReaEvidenceEnvelope;
            }
          }
        } catch {
          // Skip malformed chunk
        }
      }
    }
  }

  return { evidence, progress };
}

export function formatBytes(bytes: number | null | undefined): string {
  if (typeof bytes !== 'number' || !Number.isFinite(bytes) || bytes < 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function formatHexOffset(offset: number | null | undefined): string {
  if (typeof offset !== 'number' || !Number.isFinite(offset)) return '—';
  return `0x${offset.toString(16)}`;
}

export function shortHash(hash: string | null | undefined): string {
  if (!hash) return '—';
  return hash.length > 16 ? `${hash.slice(0, 12)}…${hash.slice(-6)}` : hash;
}

function classifyHardeningStatus(property: string, state: string): 'ok' | 'warn' | 'error' | 'neutral' {
  const s = state.toLowerCase();
  const p = property.toLowerCase();
  if (s === 'not_applicable' || s === 'unknown') return 'neutral';
  if (p === 'rpath' || p === 'runpath') {
    return s === 'disabled' ? 'ok' : 'warn';
  }
  if (p === 'stripped') {
    return 'neutral';
  }
  if (s === 'enabled' || s === 'full') return 'ok';
  if (s === 'partial') return 'warn';
  if (s === 'disabled') return 'error';
  return 'neutral';
}

function stringifyCompact(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    if (value.length === 0) return 'None (0)';
    if (value.every((v) => typeof v === 'string' || typeof v === 'number')) {
      const preview = value.slice(0, 6).join(', ');
      return value.length > 6 ? `${preview} (+${value.length - 6} more)` : preview;
    }
    return `${value.length} items`;
  }
  if (typeof value === 'object') {
    const keys = Object.keys(value as Record<string, unknown>);
    return `${keys.length} fields`;
  }
  return String(value);
}

/**
 * Normalizes any canonical REA Evidence v2 envelope into structured summary cards,
 * tables, and limitations for the UI.
 */
export function normalizeEvidenceSummary(evidence: ReaEvidenceEnvelope): NormalizedEvidenceSummary {
  const subject = evidence.subject ?? {};
  const identity = subject.identity ?? {};
  const norm = (evidence.normalized_result ?? {}) as Record<string, unknown>;
  const artifact = (norm.artifact ?? {}) as Record<string, unknown>;

  const rawBytes =
    typeof artifact.bytes === 'number'
      ? artifact.bytes
      : typeof norm.bytes === 'number'
        ? norm.bytes
        : undefined;

  const sections: NormalizedSection[] = [];

  // 1. Binary Hardening rows
  if (Array.isArray(norm.images)) {
    for (const img of norm.images as Array<Record<string, unknown>>) {
      if (Array.isArray(img.rows)) {
        const rows: NormalizedFindingRow[] = (img.rows as Array<Record<string, unknown>>).map((r) => {
          const prop = String(r.property ?? 'unknown');
          const state = String(r.state ?? 'unknown');
          const loc = r.location as { offset?: number; bytes?: number } | null | undefined;
          return {
            key: prop.replace(/_/g, ' '),
            value: state.replace(/_/g, ' '),
            status: classifyHardeningStatus(prop, state),
            detail: typeof r.basis === 'string' ? r.basis : undefined,
            offset: loc && typeof loc.offset === 'number' ? formatHexOffset(loc.offset) : undefined,
          };
        });
        sections.push({
          title: `Security Hardening (${String(img.format ?? identity.format ?? 'binary').toUpperCase()} ${String(img.architecture ?? '')})`.trim(),
          columns: ['Protection', 'State', 'Evidence Basis'],
          rows,
        });
      }
    }
  }

  // 2. ELF Dependencies (needed libraries & undefined symbols)
  if (Array.isArray(norm.needed) || Array.isArray(norm.needed_libraries)) {
    const needed = (norm.needed ?? norm.needed_libraries) as Array<unknown>;
    const rows: NormalizedFindingRow[] = needed.map((entry, idx) => {
      if (typeof entry === 'string') {
        return { key: entry, value: 'DT_NEEDED', status: 'neutral', detail: `Library #${idx + 1}` };
      }
      const obj = entry as Record<string, unknown>;
      return {
        key: String(obj.name ?? obj.soname ?? `lib-${idx + 1}`),
        value: String(obj.kind ?? 'DT_NEEDED'),
        status: 'neutral',
        detail: obj.version ? `Version: ${String(obj.version)}` : obj.offset ? `Offset ${formatHexOffset(Number(obj.offset))}` : 'Shared dependency',
      };
    });
    if (rows.length > 0) {
      sections.push({
        title: `Shared Library Dependencies (${rows.length})`,
        columns: ['Library', 'Tag', 'Details'],
        rows,
      });
    }
  }

  if (Array.isArray(norm.undefined_imports) && norm.undefined_imports.length > 0) {
    const imports = norm.undefined_imports as Array<Record<string, unknown>>;
    const rows: NormalizedFindingRow[] = imports.slice(0, 40).map((imp) => ({
      key: String(imp.name ?? 'symbol'),
      value: String(imp.version ?? imp.bind ?? 'GLOBAL'),
      status: 'neutral',
      detail: imp.library ? `From ${String(imp.library)}` : String(imp.type ?? 'Import'),
    }));
    sections.push({
      title: `Dynamic Symbol Imports (${imports.length}${imports.length > 40 ? ', showing first 40' : ''})`,
      columns: ['Symbol', 'Version / Bind', 'Source'],
      rows,
    });
  }

  // 3. JavaScript Application Graph (nodes, edges, statistics, routes)
  const graph = (norm.application_graph ?? norm.graph ?? norm) as Record<string, unknown>;
  if (Array.isArray(graph.nodes) && graph.nodes.length > 0) {
    const nodes = graph.nodes as Array<Record<string, unknown>>;
    const rows: NormalizedFindingRow[] = nodes.slice(0, 50).map((n) => {
      const nodePath = String(n.path ?? n.relative_path ?? n.label ?? n.name ?? n.id ?? 'node');
      const kind = String(n.kind ?? n.type ?? 'node').replace(/_/g, ' ');
      const detailParts: string[] = [];
      if (typeof n.language === 'string') detailParts.push(n.language);
      if (typeof n.module_system === 'string') detailParts.push(n.module_system);
      if (typeof n.bytes === 'number') detailParts.push(formatBytes(n.bytes));
      if (typeof n.summary === 'string') detailParts.push(n.summary);
      return {
        key: nodePath,
        value: kind,
        status: 'ok',
        detail: detailParts.join(' · ') || String(n.id ?? 'Graph node'),
      };
    });
    sections.push({
      title: `Application Graph Nodes (${nodes.length}${nodes.length > 50 ? ', showing first 50' : ''})`,
      columns: ['Artifact / Node', 'Kind', 'Details'],
      rows,
    });
  } else if (Array.isArray(graph.modules) && graph.modules.length > 0) {
    const modules = graph.modules as Array<Record<string, unknown>>;
    const rows: NormalizedFindingRow[] = modules.slice(0, 50).map((m) => {
      const impCount = Array.isArray(m.imports) ? m.imports.length : typeof m.import_count === 'number' ? m.import_count : 0;
      const expCount = Array.isArray(m.exports) ? m.exports.length : typeof m.export_count === 'number' ? m.export_count : 0;
      const modulePath = String(m.relative_path ?? m.path ?? m.id ?? 'module');
      return {
        key: modulePath,
        value: `${impCount} imports · ${expCount} exports`,
        status: 'ok',
        detail: String(m.module_kind ?? m.kind ?? m.language ?? 'JavaScript module'),
      };
    });
    sections.push({
      title: `Reconstructed Modules (${modules.length})`,
      columns: ['Module Path', 'Edges', 'Classification'],
      rows,
    });
  }

  if (norm.statistics && typeof norm.statistics === 'object' && !Array.isArray(norm.statistics)) {
    const statsEntries = Object.entries(norm.statistics as Record<string, unknown>);
    if (statsEntries.length > 0) {
      sections.push({
        title: 'Static Analysis Statistics',
        columns: ['Metric', 'Value', 'Category'],
        rows: statsEntries.map(([k, v]) => ({
          key: k.replace(/_/g, ' '),
          value: k.includes('bytes') && typeof v === 'number' ? formatBytes(v) : stringifyCompact(v),
          status: 'neutral',
          detail: 'Observed during static parse',
        })),
      });
    }
  }

  // 4. Release Exposure Audit findings
  if (Array.isArray(norm.findings) && norm.findings.length > 0) {
    const findings = norm.findings as Array<Record<string, unknown>>;
    const rows: NormalizedFindingRow[] = findings.slice(0, 50).map((f) => {
      const sev = String(f.severity ?? f.level ?? f.status ?? 'info').toLowerCase();
      const status: 'ok' | 'warn' | 'error' | 'neutral' =
        sev.includes('high') || sev.includes('crit')
          ? 'error'
          : sev.includes('med') || sev.includes('warn')
            ? 'warn'
            : 'neutral';
      return {
        key: String(f.title ?? f.kind ?? f.category ?? f.id ?? 'Finding'),
        value: sev.toUpperCase(),
        status,
        detail: String(f.summary ?? f.detail ?? f.path ?? f.message ?? ''),
      };
    });
    sections.push({
      title: `Audit Findings (${findings.length})`,
      columns: ['Finding', 'Severity', 'Evidence'],
      rows,
    });
  }

  // 5. Generic normalized_result summary fallback if no specialized section matched
  if (sections.length === 0) {
    const ignored = new Set(['artifact', 'limitations', 'input_path']);
    const entries = Object.entries(norm).filter(([k]) => !ignored.has(k));
    if (entries.length > 0) {
      const rows: NormalizedFindingRow[] = entries.slice(0, 30).map(([k, v]) => ({
        key: k.replace(/_/g, ' '),
        value: stringifyCompact(v),
        status: 'neutral',
        detail: Array.isArray(v)
          ? `Array (${v.length})`
          : v && typeof v === 'object'
            ? Object.keys(v as Record<string, unknown>).slice(0, 5).join(', ')
            : typeof v,
      }));
      sections.push({
        title: 'Extracted Result Fields',
        columns: ['Field', 'Value', 'Structure'],
        rows,
      });
    }
  }

  const limitations = Array.isArray(evidence.limitations)
    ? evidence.limitations.filter((l): l is string => typeof l === 'string')
    : Array.isArray(norm.limitations)
      ? (norm.limitations as unknown[]).filter((l): l is string => typeof l === 'string')
      : [];

  return {
    evidenceId: String(evidence.evidence_id ?? '—'),
    operation: String(evidence.operation ?? evidence.predicate_type ?? 'analysis'),
    providerName: String(evidence.provider?.name ?? evidence.provider?.id ?? 'REA'),
    subjectName: String(subject.name ?? subject.local_path ?? 'Target'),
    format: String(identity.format ?? norm.format ?? 'unknown').toUpperCase(),
    architecture: String(identity.architecture ?? '—'),
    sha256: String(identity.sha256 ?? artifact.sha256 ?? '—'),
    byteSize: formatBytes(rawBytes),
    confidence: String(evidence.confidence ?? 'observed'),
    sections,
    limitations,
  };
}
