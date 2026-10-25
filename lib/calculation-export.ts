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
