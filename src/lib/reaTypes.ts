export type AnalyzerId =
  | 'inspect-binary-hardening'
  | 'inspect-elf-dependencies'
  | 'inspect-elf-notes'
  | 'inspect-byte-entropy'
  | 'analyze-javascript-application'
  | 'audit-release-exposure'
  | 'inspect-electron-fuses'
  | 'inspect-desktop-application'
  | 'inspect-go-binary'
  | 'inspect-rust-binary'
  | 'inspect-pe-imports'
  | 'inspect-pe-certificates'
  | 'inspect-managed-artifact'
  | 'inspect-python-pyc'
  | 'inspect-apk-signature'
  | 'identify-flutter-build'
  | 'inspect-model-artifact'
  | 'inspect-nuget-nupkg';

export interface AnalyzerDefinition {
  id: AnalyzerId;
  label: string;
  category: 'Native Binary' | 'JavaScript & Release' | 'Language & Runtime' | 'Mobile & Packages';
  description: string;
  supportedTargets: string;
  targetKind: 'file' | 'directory' | 'either';
}

export interface PresetTarget {
  id: string;
  title: string;
  subtitle: string;
  path: string;
  recommendedAnalyzer: AnalyzerId;
  category: string;
}

export interface ReaCommandItem {
  name: string;
  description: string;
  category: string;
  runnableInWorkbench: boolean;
}

export interface ReaProgressEvent {
  phase: string;
  completed: number;
  total: number;
  message: string;
  sequence?: number;
  terminal?: boolean;
}

export interface ReaEvidenceSubject {
  identity?: {
    kind?: string;
    sha256?: string | null;
    format?: string | null;
    architecture?: string | null;
  };
  name?: string;
  local_path?: string;
}

export interface ReaEvidenceEnvelope {
  evidence_id?: string;
  evidence_format?: number;
  subject?: ReaEvidenceSubject;
  provider?: {
    id?: string;
    name?: string;
    version?: string;
  };
  predicate_type?: string;
  operation?: string;
  parameters?: Record<string, unknown>;
  normalized_result?: Record<string, unknown>;
  confidence?: string;
  authority?: string;
  limitations?: string[];
  locations?: Array<Record<string, unknown>>;
  [key: string]: unknown;
}

export interface AnalysisRunResult {
  id: string;
  command: string;
  targetLabel: string;
  targetPath: string;
  timestamp: string;
  durationMs: number;
  exitCode: number;
  ok: boolean;
  evidence: ReaEvidenceEnvelope | null;
  progress: ReaProgressEvent[];
  rawStdout: string;
  stderr: string;
  error?: string;
}

export interface DoctorCheck {
  name: string;
  ok: boolean;
  classification: string;
  detail?: string;
  remediation?: string;
}

export interface DoctorProvider {
  id: string;
  configured: boolean;
  available: boolean;
  providerVersion: string | null;
  checks: Array<{
    name: string;
    ok: boolean;
    code?: string;
    detail?: string;
    remediation?: string;
    classification?: string;
  }>;
}

export interface ReaDoctorReport {
  healthy: boolean;
  environment_healthy: boolean;
  checks: DoctorCheck[];
  providerInspections: DoctorProvider[];
  identity?: {
    cli_package_version?: string;
    expected_skill_version?: string;
    catalog?: {
      counts?: {
        cli_commands?: number;
        mcp_tools?: number;
        mcp_prompts?: number;
      };
      digests?: {
        combined_sha256?: string;
      };
    };
  };
}

export interface NormalizedFindingRow {
  key: string;
  value: string;
  status?: 'ok' | 'warn' | 'error' | 'neutral';
  detail?: string;
  offset?: string;
}

export interface NormalizedSection {
  title: string;
  columns: [string, string, string];
  rows: NormalizedFindingRow[];
}

export interface NormalizedEvidenceSummary {
  evidenceId: string;
  operation: string;
  providerName: string;
  subjectName: string;
  format: string;
  architecture: string;
  sha256: string;
  byteSize: string;
  confidence: string;
  sections: NormalizedSection[];
  limitations: string[];
}
