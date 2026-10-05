import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import {
  appendDigit,
  applyOperator,
  backspace,
  formatResult,
  HISTORY_LIMIT,
  operatorLabel,
  percent,
  toggleSign,
  type HistoryEntry,
  type Operator,
} from './calculator-logic';

type KeyAction =
  | { kind: 'digit'; value: string }
  | { kind: 'operator'; value: Operator }
  | { kind: 'equals' }
  | { kind: 'clear' }
  | { kind: 'sign' }
  | { kind: 'percent' }
  | { kind: 'decimal' };

interface Key {
  label: string;
  classes: string;
  ariaLabel: string;
  action: KeyAction;
}

@Component({
  selector: 'app-calculator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './calculator.html',
  styleUrl: './calculator.css',
  host: {
    '(window:keydown)': 'onKeydown($event)',
  },
})
export class Calculator {
  protected readonly display = signal('0');
  protected readonly accumulator = signal<number | null>(null);
  protected readonly pendingOperator = signal<Operator | null>(null);
  protected readonly replaceOnNextDigit = signal(false);
  protected readonly history = signal<HistoryEntry[]>([]);
  protected readonly hasHistory = computed(() => this.history().length > 0);

  protected readonly keys: Key[] = [
    { label: 'AC', classes: 'key key--fn', ariaLabel: 'All clear', action: { kind: 'clear' } },
    { label: '+/-', classes: 'key key--fn', ariaLabel: 'Toggle sign', action: { kind: 'sign' } },
    { label: '%', classes: 'key key--fn', ariaLabel: 'Percent', action: { kind: 'percent' } },
    { label: '÷', classes: 'key key--operator', ariaLabel: 'Divide', action: { kind: 'operator', value: '/' } },
    { label: '7', classes: 'key', ariaLabel: 'Seven', action: { kind: 'digit', value: '7' } },
    { label: '8', classes: 'key', ariaLabel: 'Eight', action: { kind: 'digit', value: '8' } },
    { label: '9', classes: 'key', ariaLabel: 'Nine', action: { kind: 'digit', value: '9' } },
    { label: '×', classes: 'key key--operator', ariaLabel: 'Multiply', action: { kind: 'operator', value: '*' } },
    { label: '4', classes: 'key', ariaLabel: 'Four', action: { kind: 'digit', value: '4' } },
    { label: '5', classes: 'key', ariaLabel: 'Five', action: { kind: 'digit', value: '5' } },
    { label: '6', classes: 'key', ariaLabel: 'Six', action: { kind: 'digit', value: '6' } },
    { label: '−', classes: 'key key--operator', ariaLabel: 'Subtract', action: { kind: 'operator', value: '-' } },
    { label: '1', classes: 'key', ariaLabel: 'One', action: { kind: 'digit', value: '1' } },
    { label: '2', classes: 'key', ariaLabel: 'Two', action: { kind: 'digit', value: '2' } },
    { label: '3', classes: 'key', ariaLabel: 'Three', action: { kind: 'digit', value: '3' } },
    { label: '+', classes: 'key key--operator', ariaLabel: 'Add', action: { kind: 'operator', value: '+' } },
    { label: '0', classes: 'key key--wide', ariaLabel: 'Zero', action: { kind: 'digit', value: '0' } },
    { label: '.', classes: 'key', ariaLabel: 'Decimal point', action: { kind: 'decimal' } },
    { label: '=', classes: 'key key--operator key--equals', ariaLabel: 'Equals', action: { kind: 'equals' } },
  ];

  protected onKeyPress(action: KeyAction): void {
    switch (action.kind) {
      case 'digit':
        this.pressDigit(action.value);
        return;
      case 'operator':
        this.pressOperator(action.value);
        return;
      case 'equals':
        this.equals();
        return;
      case 'clear':
        this.clear();
        return;
      case 'sign':
        this.toggleSign();
        return;
      case 'percent':
        this.applyPercent();
        return;
      case 'decimal':
        this.pressDecimal();
    }
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.metaKey || event.ctrlKey || event.altKey) {
      return;
    }
    const key = event.key;

    if (/^[0-9]$/.test(key)) {
      this.pressDigit(key);
    } else if (key === '.' || key === ',') {
      this.pressDecimal();
    } else if (key === '+' || key === '-' || key === '*' || key === '/') {
      this.pressOperator(key);
    } else if (key === 'Enter' || key === '=') {
      this.equals();
    } else if (key === 'Escape') {
      this.clear();
    } else if (key === 'Backspace') {
      this.pressBackspace();
    } else if (key === 'Delete') {
      this.clear();
    } else if (key === '%') {
      this.applyPercent();
    } else {
      return;
    }

    event.preventDefault();
  }

  protected clearHistory(): void {
    this.history.set([]);
  }

  private pressDigit(digit: string): void {
    if (this.replaceOnNextDigit()) {
      this.display.set(digit);
      this.replaceOnNextDigit.set(false);
      return;
    }
    if (digit === '.' || this.display() === 'Error') {
      this.display.set(digit === '.' ? '0.' : digit);
      return;
    }
    this.display.set(appendDigit(this.display(), digit));
  }

  private pressDecimal(): void {
    if (this.replaceOnNextDigit()) {
      this.display.set('0.');
      this.replaceOnNextDigit.set(false);
      return;
    }
    if (this.display() === 'Error' || this.display().includes('.')) {
      return;
    }
    this.display.set(this.display() + '.');
  }

  private pressOperator(operator: Operator): void {
    const current = this.display();
    if (current === 'Error') {
      return;
    }

    const accumulator = this.accumulator();
    const pending = this.pendingOperator();

    if (accumulator !== null && pending !== null && !this.replaceOnNextDigit()) {
      const result = applyOperator(accumulator, pending, Number(current));
      this.record(`${formatResult(accumulator)} ${operatorLabel(pending)} ${current}`, result);
      this.accumulator.set(result);
      this.display.set(formatResult(result));
    } else {
      this.accumulator.set(Number(current));
    }

    this.pendingOperator.set(operator);
    this.replaceOnNextDigit.set(true);
  }

  private equals(): void {
    const accumulator = this.accumulator();
    const pending = this.pendingOperator();
    if (accumulator === null || pending === null) {
      return;
    }

    const current = this.display();
    const result = applyOperator(accumulator, pending, Number(current));
    this.record(`${formatResult(accumulator)} ${operatorLabel(pending)} ${current} =`, result);

    this.display.set(formatResult(result));
    this.accumulator.set(null);
    this.pendingOperator.set(null);
    this.replaceOnNextDigit.set(true);
  }

  private clear(): void {
    this.display.set('0');
    this.accumulator.set(null);
    this.pendingOperator.set(null);
    this.replaceOnNextDigit.set(false);
  }

  private toggleSign(): void {
    this.display.set(toggleSign(this.display()));
    this.replaceOnNextDigit.set(false);
  }

  private applyPercent(): void {
    this.display.set(percent(this.display()));
    this.replaceOnNextDigit.set(false);
  }

  private pressBackspace(): void {
    this.display.set(backspace(this.display()));
    this.replaceOnNextDigit.set(false);
  }

  private record(pendingPart: string, result: number): void {
    const formatted = formatResult(result);
    const entry: HistoryEntry = { expression: pendingPart, result: formatted };
    this.history.update((entries) => [entry, ...entries].slice(0, HISTORY_LIMIT));
  }
}