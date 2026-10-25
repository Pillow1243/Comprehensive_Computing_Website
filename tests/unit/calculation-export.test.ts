import { describe, expect, it } from 'vitest';
import { calculationAsCsv, calculationAsJson, type CalculationExportRecord } from '@/lib/calculation-export';

const record: CalculationExportRecord = {
  formula_id: 'sample',
  formula_name: 'Example',
  formula_latex: 'x^2',
  inputs: { x: 3, note: '=HYPERLINK("https://bad.test")' },
  input_units: { x: 'm', note: null },
  outputs: { value: 9 },
  output_units: { value: 'm²' },
  steps: ['Use x²'],
  created_at: '2026-10-25T00:00:00.000Z',
};

describe('calculation export', () => {
  it('exports complete calculation data as JSON', () => {
    expect(JSON.parse(calculationAsJson(record))).toEqual(record);
  });

  it('quotes and escapes CSV cells and neutralises spreadsheet formulas', () => {
    const csv = calculationAsCsv(record);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv).toContain('"input","x","3","m"');
    expect(csv).toContain("'=HYPERLINK(\"\"https://bad.test\"\")");
    expect(csv).toContain('"step","1","Use x²",""');
    expect(csv.endsWith('\r\n')).toBe(true);
  });

  it.each(['=1+1', '+SUM(A1:A2)', '@cmd', ' -1+2'])('neutralises a text field beginning with %s', (unsafe) => {
    const csv = calculationAsCsv({ ...record, inputs: { raw: unsafe } });
    expect(csv).toContain(`'${unsafe}`);
  });
});
