export interface CalculationExportRecord {
  formula_id: string;
  formula_name: string;
  formula_latex: string;
  inputs: Record<string, unknown>;
  input_units: Record<string, string | null>;
  outputs: Record<string, unknown>;
  output_units: Record<string, string | null>;
  steps: string[];
  created_at: string;
}

const printable = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

export function calculationAsJson(record: CalculationExportRecord): string {
  return `${JSON.stringify(record, null, 2)}\n`;
}

/** Quote CSV cells and neutralise spreadsheet formula prefixes in text values. */
const csvCell = (value: unknown): string => {
  let text = printable(value);
  if (typeof value === 'string' && /^[\t\r\n ]*[=+@-]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
};

export function calculationAsCsv(record: CalculationExportRecord): string {
  const rows: unknown[][] = [
    ['section', 'name', 'value', 'unit'],
    ['formula', 'id', record.formula_id, ''],
    ['formula', 'name', record.formula_name, ''],
    ['formula', 'LaTeX', record.formula_latex, ''],
    ['metadata', 'created_at', record.created_at, ''],
    ...Object.entries(record.inputs).map(([name, value]) => ['input', name, value, record.input_units[name] ?? '']),
    ...Object.entries(record.outputs).map(([name, value]) => ['output', name, value, record.output_units[name] ?? '']),
    ...record.steps.map((step, index) => ['step', index + 1, step, '']),
  ];
  // UTF-8 BOM improves Persian/Arabic text detection in common spreadsheet apps.
  return `\uFEFF${rows.map((row) => row.map(csvCell).join(',')).join('\r\n')}\r\n`;
}

/** Escape a value for a GitHub-flavoured Markdown table cell. */
const mdCell = (value: unknown): string =>
  printable(value).replace(/\|/g, '\\|').replace(/\r?\n/g, '<br>');

/** Escape LaTeX special characters in plain-text values. */
const texEscape = (value: unknown): string =>
  printable(value)
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/([&%$#_{}])/g, '\\$1')
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/\^/g, '\\textasciicircum{}');

export interface ReportLabels {
  inputs: string;
  outputs: string;
  steps: string;
  generatedWith: string;
}

const DEFAULT_LABELS: ReportLabels = {
  inputs: 'Inputs',
  outputs: 'Outputs',
  steps: 'Step-by-step solution',
  generatedWith: 'Generated with SolveEverything',
};

/** Human-readable Markdown report of one calculation (v4). */
export function calculationAsMarkdown(
  record: CalculationExportRecord,
  labels: ReportLabels = DEFAULT_LABELS,
): string {
  const table = (
    entries: Record<string, unknown>,
    units: Record<string, string | null>,
  ): string => {
    const rows = Object.entries(entries).map(
      ([name, value]) => `| ${mdCell(name)} | ${mdCell(value)} | ${mdCell(units[name] ?? '')} |`,
    );
    return ['| Name | Value | Unit |', '| --- | --- | --- |', ...rows].join('\n');
  };
  const lines = [
    `# ${record.formula_name}`,
    '',
    record.formula_latex ? `$$${record.formula_latex}$$` : '',
    '',
    `## ${labels.inputs}`,
    '',
    table(record.inputs, record.input_units),
    '',
    `## ${labels.outputs}`,
    '',
    table(record.outputs, record.output_units),
  ];
  if (record.steps.length) {
    lines.push('', `## ${labels.steps}`, '', ...record.steps.map((step, index) => `${index + 1}. ${step}`));
  }
  lines.push('', '---', '', `*${labels.generatedWith} · ${record.created_at}*`, '');
  return `${lines.join('\n')}\n`;
}

/** LaTeX report section for one calculation (v4). */
export function calculationAsLatex(
  record: CalculationExportRecord,
  labels: ReportLabels = DEFAULT_LABELS,
): string {
  const table = (entries: Record<string, unknown>, units: Record<string, string | null>): string => {
    const rows = Object.entries(entries).map(
      ([name, value]) =>
        `    ${texEscape(name)} & ${texEscape(value)} & ${texEscape(units[name] ?? '')} \\\\`,
    );
    return [
      '  \\begin{tabular}{lll}',
      '    \\textbf{Name} & \\textbf{Value} & \\textbf{Unit} \\\\ \\hline',
      ...rows,
      '  \\end{tabular}',
    ].join('\n');
  };
  const lines = [
    '% Generated with SolveEverything',
    `\\section*{${texEscape(record.formula_name)}}`,
    record.formula_latex ? `\\[ ${record.formula_latex} \\]` : '',
    `\\subsection*{${texEscape(labels.inputs)}}`,
    table(record.inputs, record.input_units),
    `\\subsection*{${texEscape(labels.outputs)}}`,
    table(record.outputs, record.output_units),
  ];
  if (record.steps.length) {
    lines.push(
      `\\subsection*{${texEscape(labels.steps)}}`,
      '  \\begin{enumerate}',
      ...record.steps.map((step) => `    \\item ${texEscape(step)}`),
      '  \\end{enumerate}',
    );
  }
  lines.push(`\\textit{${texEscape(labels.generatedWith)} · ${texEscape(record.created_at)}}`, '');
  return `${lines.filter((line) => line !== '').join('\n')}\n`;
}

/** One Markdown document for a whole workspace collection (v4). */
export function recordsAsMarkdown(
  records: CalculationExportRecord[],
  title: string,
  labels: ReportLabels = DEFAULT_LABELS,
): string {
  const body = records
    .map((record) => calculationAsMarkdown(record, labels).replace(/^# /, '## '))
    .join('\n');
  return `# ${title}\n\n${body}`;
}

export function downloadTextFile(content: string, mimeType: string, filename: string): void {
  if (typeof document === 'undefined' || typeof URL.createObjectURL !== 'function') return;
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.hidden = true;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}
