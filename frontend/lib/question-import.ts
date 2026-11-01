export interface BulkQuestionInput {
  questionText: string; subject?: string; explanation?: string;
  marks: number; negativeMarks: number;
  options: { text: string; isCorrect: boolean }[];
}
export interface QuestionImportPreview {
  rows: { row: number; question: BulkQuestionInput }[];
  errors: { row: number; message: string }[];
  totalRows: number;
}
export const MAX_IMPORT_QUESTIONS = 500;
export const MAX_IMPORT_FILE_BYTES = 2 * 1024 * 1024;
const columns = ['question', 'optionA', 'optionB', 'optionC', 'optionD', 'correctAnswer', 'subject', 'explanation', 'marks', 'negativeMarks'] as const;
const required = columns.slice(0, 6);
const normalizeHeader = (header: string) => header.trim().replace(/[\s_-]/g, '').toLowerCase();

// Handles UTF-8, quoted commas/newlines, escaped quotes, and both common line endings.
function csvRecords(input: string): { row: number; cells: string[] }[] {
  const text = input.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  const records: { row: number; cells: string[] }[] = [];
  let cells: string[] = [], field = '', quoted = false, closed = false, line = 1, row = 1;
  const finishField = () => { cells.push(field); field = ''; closed = false; };
  const finishRow = () => {
    finishField();
    if (cells.some(cell => cell.trim())) records.push({ row, cells });
    cells = []; row = line + 1;
  };
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else { quoted = false; closed = true; }
      } else { field += char; if (char === '\n') line++; }
      continue;
    }
    if (char === ',') { finishField(); continue; }
    if (char === '\n') { finishRow(); line++; continue; }
    if (closed) {
      if (char === ' ' || char === '\t') continue;
      throw new Error(`Row ${line}: Unexpected character after a closing quote.`);
    }
    if (char === '"') {
      if (field.length) throw new Error(`Row ${line}: Quotes must surround the entire field.`);
      quoted = true;
    } else field += char;
  }
  if (quoted) throw new Error(`Row ${row}: Unclosed quoted field.`);
  finishRow();
  return records;
}

function fromRecord(record: Record<string, unknown>): { question?: BulkQuestionInput; message?: string } {
  const errors: string[] = [];
  const stringField = (key: string, max: number, needed = false) => {
    const value = record[key];
    if (value === undefined && !needed) return '';
    if (typeof value !== 'string' || (needed && !value.trim()) || (typeof value === 'string' && value.length > max)) {
      errors.push(`${key}: ${needed ? 'required text' : 'text'} (maximum ${max} characters).`); return '';
    }
    return value.trim();
  };
  const questionText = stringField('question', 10000, true);
  const subject = stringField('subject', 200);
  const explanation = stringField('explanation', 20000);
  const texts = ['optionA', 'optionB', 'optionC', 'optionD'].map(key => stringField(key, 5000, true));
  const answer = typeof record.correctAnswer === 'string' ? record.correctAnswer.trim().toUpperCase() : '';
  if (!/^[A-D]$/.test(answer)) errors.push('correctAnswer must be A, B, C, or D.');
  const numericField = (key: string, fallback: number, positive: boolean) => {
    const value = record[key];
    if (value === undefined || (typeof value === 'string' && !value.trim())) return fallback;
    const number = typeof value === 'number' ? value : typeof value === 'string' && /^(?:\d+(?:\.\d*)?|\.\d+)$/.test(value.trim()) ? Number(value) : NaN;
    if (!Number.isFinite(number) || (positive ? number <= 0 : number < 0) || number > 1000) errors.push(`${key} must be ${positive ? 'greater than 0' : '0 or more'} and at most 1,000.`);
    return number;
  };
  const marks = numericField('marks', 1, true);
  const negativeMarks = numericField('negativeMarks', .25, false);
  if (errors.length) return { message: errors.join(' ') };
  return { question: { questionText, subject: subject || undefined, explanation: explanation || undefined, marks, negativeMarks, options: texts.map((text, index) => ({ text, isCorrect: index === answer.charCodeAt(0) - 65 })) } };
}

export function parseQuestionImport(text: string, format: 'csv' | 'json'): QuestionImportPreview {
  const raw: { row: number; value: unknown }[] = [];
  const errors: QuestionImportPreview['errors'] = [];
  const source = text.replace(/^\uFEFF/, '');
  if (format === 'json') {
    let data: unknown;
    try { data = JSON.parse(source); } catch { throw new Error('Invalid JSON. Use the downloadable JSON template.'); }
    if (!Array.isArray(data)) throw new Error('The JSON file must contain an array of questions.');
    data.forEach((value, index) => raw.push({ row: index + 1, value }));
  } else {
    const records = csvRecords(source);
    if (!records.length) throw new Error('The file is empty.');
    const header = records[0].cells.map(normalizeHeader);
    if (new Set(header).size !== header.length) throw new Error('CSV contains duplicate column headings.');
    const known = new Map(columns.map(column => [normalizeHeader(column), column]));
    const missing = required.filter(column => !header.includes(normalizeHeader(column)));
    if (missing.length) throw new Error(`Missing required columns: ${missing.join(', ')}.`);
    const unknown = header.filter(column => !known.has(column));
    if (unknown.length) throw new Error(`Unknown columns: ${unknown.join(', ')}. Use the downloadable template.`);
    records.slice(1).forEach(record => {
      if (record.cells.length !== header.length) { errors.push({ row: record.row, message: 'Column count does not match the header. Put fields containing commas inside double quotes.' }); raw.push({ row: record.row, value: null }); return; }
      raw.push({ row: record.row, value: Object.fromEntries(header.map((column, index) => [known.get(column)!, record.cells[index]])) });
    });
  }
  if (!raw.length) throw new Error('The file contains no questions.');
  if (raw.length > MAX_IMPORT_QUESTIONS) throw new Error(`Upload at most ${MAX_IMPORT_QUESTIONS} questions at a time.`);
  const rows: QuestionImportPreview['rows'] = [];
  const seen = new Map<string, number>();
  for (const { row, value } of raw) {
    if (errors.some(error => error.row === row)) continue;
    if (!value || typeof value !== 'object' || Array.isArray(value)) { errors.push({ row, message: 'Expected a question object.' }); continue; }
    const result = fromRecord(value as Record<string, unknown>);
    if (!result.question) { errors.push({ row, message: result.message! }); continue; }
    const q = result.question;
    const fingerprint = JSON.stringify([q.questionText, q.subject || '', q.marks, q.negativeMarks, q.options.map(o => [o.text, o.isCorrect])]);
    const first = seen.get(fingerprint);
    if (first !== undefined) { errors.push({ row, message: `Duplicate of row ${first}.` }); continue; }
    seen.set(fingerprint, row);
    rows.push({ row, question: q });
  }
  return { rows, errors: errors.sort((a, b) => a.row - b.row), totalRows: raw.length };
}
