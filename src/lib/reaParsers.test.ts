import test from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyCommandCategory,
  formatBytes,
  formatHexOffset,
  normalizeEvidenceSummary,
  parseReaHelpCommands,
  parseReaJsonStream,
  shortHash,
} from './reaParsers';

test('parseReaHelpCommands extracts command names, descriptions, and workbench runnability', () => {
  const sampleHelp = `rea@6.10.1 — Reverse engineer anything from your terminal or agent.

Usage: rea <command>

Commands:
  analyze-javascript-application          Statically reconstruct a local JavaScript/Electron application
  inspect-binary-hardening                Inspect ELF, PE and Mach-O hardening flags
  capture-adb-screen                      Capture one screen frame as a digested PNG
  doctor                                  Check environment health

Options:
  --help  Show help
`;

  const commands = parseReaHelpCommands(sampleHelp);
  assert.equal(commands.length, 4);
  assert.equal(commands[0].name, 'analyze-javascript-application');
  assert.equal(commands[0].runnableInWorkbench, true);
  assert.equal(commands[0].category, 'JavaScript, Electron & Web');

  assert.equal(commands[1].name, 'inspect-binary-hardening');
  assert.equal(commands[1].runnableInWorkbench, true);
  assert.equal(commands[1].category, 'Native Binaries & Decompilers');

  assert.equal(commands[2].name, 'capture-adb-screen');
  assert.equal(commands[2].runnableInWorkbench, false);
  assert.equal(commands[2].category, 'Android & Mobile');

  assert.equal(commands[3].name, 'doctor');
  assert.equal(commands[3].category, 'Workflow, Evidence & MCP');
});

test('parseReaJsonStream separates concatenated progress events from final Evidence object', () => {
  const stream =
    '{"rea_progress":{"phase":"parse","completed":0,"total":1,"message":"Parsing {braces} inside string"}}' +
    '{"rea_progress":{"phase":"done","completed":1,"total":1,"message":"Done","terminal":true}}' +
    '{"evidence_id":"ev_123","operation":"analyze_javascript_application","normalized_result":{"modules":[]}}';

  const { progress, evidence } = parseReaJsonStream(stream);
  assert.equal(progress.length, 2);
  assert.equal(progress[0].message, 'Parsing {braces} inside string');
  assert.equal(progress[1].terminal, true);
  assert.ok(evidence);
  assert.equal(evidence.evidence_id, 'ev_123');
  assert.equal(evidence.operation, 'analyze_javascript_application');
});

test('normalizeEvidenceSummary maps binary hardening rows and limitations accurately', () => {
  const summary = normalizeEvidenceSummary({
    evidence_id: 'ev_hardening_1',
    operation: 'inspect_binary_hardening',
    confidence: 'derived',
    provider: { id: 'rea-binary-hardening', name: 'REA binary hardening parser' },
    subject: {
      name: 'ls',
      identity: { format: 'elf', architecture: 'x86_64', sha256: 'abcdef1234567890abcdef1234567890' },
    },
    normalized_result: {
      artifact: { bytes: 151344 },
      images: [
        {
          format: 'elf',
          architecture: 'x86_64',
          rows: [
            { property: 'pie', state: 'enabled', basis: 'ET_DYN', location: { offset: 256, bytes: 16 } },
            { property: 'relro', state: 'partial', basis: 'PT_GNU_RELRO without BIND_NOW' },
            { property: 'cet_ibt_shstk', state: 'disabled', basis: 'Note absent' },
            { property: 'rpath', state: 'disabled', basis: 'DT_RPATH absent' },
          ],
        },
      ],
    },
    limitations: ['Reads headers only.'],
  });

  assert.equal(summary.format, 'ELF');
  assert.equal(summary.byteSize, '147.8 KB');
  assert.equal(summary.sections.length, 1);
  assert.equal(summary.sections[0].rows[0].status, 'ok');
  assert.equal(summary.sections[0].rows[0].offset, '0x100');
  assert.equal(summary.sections[0].rows[1].status, 'warn');
  assert.equal(summary.sections[0].rows[2].status, 'error');
  assert.equal(summary.sections[0].rows[3].status, 'ok');
  assert.deepEqual(summary.limitations, ['Reads headers only.']);
});

test('formatting helpers handle edge values cleanly', () => {
  assert.equal(formatBytes(512), '512 B');
  assert.equal(formatBytes(2048), '2.0 KB');
  assert.equal(formatBytes(2 * 1024 * 1024), '2.00 MB');
  assert.equal(formatBytes(null), '—');
  assert.equal(formatHexOffset(4096), '0x1000');
  assert.equal(shortHash('0123456789abcdef0123456789abcdef'), '0123456789ab…abcdef');
  assert.equal(classifyCommandCategory('inspect-model-artifact'), 'Firmware, Network & Data');
});

test('normalizeEvidenceSummary parses JS application graph nodes and statistics cleanly', () => {
  const summary = normalizeEvidenceSummary({
    evidence_id: 'ev_js_1',
    operation: 'analyze_javascript_application',
    provider: { id: 'rea-javascript-application', name: 'REA JavaScript application analyzer' },
    subject: { name: 'checkout-module.js', identity: { format: 'directory', sha256: 'deadbeef' } },
    normalized_result: {
      graph: {
        nodes: [
          { id: 'n1', path: 'checkout-module.js', kind: 'javascript_module', language: 'javascript', bytes: 820 },
        ],
      },
      statistics: {
        relevant_files: 1,
        parsed_javascript_files: 1,
        text_bytes_read: 820,
      },
      limitations: ['Static parse only.'],
    },
  });

  assert.equal(summary.sections.length, 2);
  assert.equal(summary.sections[0].title, 'Application Graph Nodes (1)');
  assert.equal(summary.sections[0].rows[0].key, 'checkout-module.js');
  assert.equal(summary.sections[1].title, 'Static Analysis Statistics');
  assert.equal(summary.sections[1].rows[2].value, '820 B');
  assert.deepEqual(summary.limitations, ['Static parse only.']);
});

