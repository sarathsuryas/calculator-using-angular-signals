export type Operator = '+' | '-' | '*' | '/';

export interface HistoryEntry {
  expression: string;
  result: string;
}

export const HISTORY_LIMIT = 50;

const SIGNIFICANT_DIGITS = 12;

export function applyOperator(a: number, operator: Operator, b: number): number {
  switch (operator) {
    case '+':
      return a + b;
    case '-':
      return a - b;
    case '*':
      return a * b;
    case '/':
      return a / b;
  }
}

export function formatResult(value: number): string {
  if (!Number.isFinite(value)) {
    return 'Error';
  }
  if (value === 0) {
    return '0';
  }
  const rounded = Number.parseFloat(value.toPrecision(SIGNIFICANT_DIGITS));
  return String(rounded);
}

export function toggleSign(display: string): string {
  if (display === '0' || display === 'Error') {
    return '0';
  }
  return display.startsWith('-') ? display.slice(1) : `-${display}`;
}

export function percent(display: string): string {
  const value = Number(display);
  if (!Number.isFinite(value)) {
    return '0';
  }
  return formatResult(value / 100);
}

export function appendDigit(display: string, digit: string): string {
  if (display === 'Error' || display === '0') {
    return digit;
  }
  return display + digit;
}

export function backspace(display: string): string {
  if (display === 'Error') {
    return '0';
  }
  const trimmed = display.length > 1 ? display.slice(0, -1) : '';
  return trimmed === '' || trimmed === '-' ? '0' : trimmed;
}

export function operatorLabel(operator: Operator): string {
  return operator === '*' ? '×' : operator === '/' ? '÷' : operator;
}