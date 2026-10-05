import { TestBed } from '@angular/core/testing';
import { Calculator } from './calculator';

describe('Calculator', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<Calculator>>;

  const display = () =>
    (fixture.nativeElement as HTMLElement).querySelector('[data-testid="display"]')?.textContent?.trim();

  const history = () =>
    Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('.history__item')).map((item) => ({
      expression: item.querySelector('.history__expression')?.textContent?.trim(),
      result: item.querySelector('.history__result')?.textContent?.trim(),
    }));

  const click = (label: string) => {
    const button = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      `button[aria-label="${label}"]`,
    );
    if (!button) {
      throw new Error(`No button labelled "${label}"`);
    }
    button.click();
    fixture.detectChanges();
  };

  const press = (...labels: string[]) => labels.forEach(click);

  const type = (keys: string[]) => {
    for (const key of keys) {
      window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
      fixture.detectChanges();
    }
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Calculator] }).compileComponents();
    fixture = TestBed.createComponent(Calculator);
    fixture.detectChanges();
  });

  it('starts at zero with an empty history', () => {
    expect(display()).toBe('0');
    expect(history()).toEqual([]);
  });

  it('accumulates digits and drops a redundant leading zero', () => {
    press('Zero', 'Five');
    expect(display()).toBe('5');
  });

  it('adds two numbers', () => {
    press('Two', 'Add', 'Three', 'Equals');
    expect(display()).toBe('5');
  });

  it('subtracts, multiplies and divides', () => {
    press('Nine', 'Subtract', 'Four', 'Equals');
    expect(display()).toBe('5');

    press('All clear', 'Six', 'Multiply', 'Seven', 'Equals');
    expect(display()).toBe('42');

    press('All clear', 'Nine', 'Divide', 'Two', 'Equals');
    expect(display()).toBe('4.5');
  });

  it('enters decimals', () => {
    press('One', 'Decimal point', 'Five', 'Multiply', 'Two', 'Equals');
    expect(display()).toBe('3');
  });

  it('refuses a second decimal point', () => {
    press('One', 'Decimal point', 'Five', 'Decimal point', 'Five');
    expect(display()).toBe('1.55');
  });

  it('replaces the entry after equals instead of appending', () => {
    press('Two', 'Add', 'Three', 'Equals', 'Seven');
    expect(display()).toBe('7');
  });

  it('evaluates eagerly on chained operators', () => {
    press('Two', 'Add', 'Three', 'Add', 'Four', 'Equals');
    expect(display()).toBe('9');
  });

  it('toggles sign and normalizes negative zero', () => {
    press('Five', 'Toggle sign');
    expect(display()).toBe('-5');

    press('Toggle sign');
    expect(display()).toBe('5');

    press('All clear', 'Toggle sign');
    expect(display()).toBe('0');
  });

  it('applies percent as divide by 100', () => {
    press('Five', 'Zero', 'Percent');
    expect(display()).toBe('0.5');
  });

  it('deletes a digit with backspace', () => {
    type(['1', '2', '3', 'Backspace']);
    expect(display()).toBe('12');

    type(['Backspace', 'Backspace', 'Backspace']);
    expect(display()).toBe('0');
  });

  it('reports an error on divide by zero', () => {
    press('Five', 'Divide', 'Zero', 'Equals');
    expect(display()).toBe('Error');

    press('Two');
    expect(display()).toBe('2');
  });

  it('rounds floating point noise away', () => {
    press('Zero', 'Decimal point', 'One', 'Add', 'Zero', 'Decimal point', 'Two', 'Equals');
    expect(display()).toBe('0.3');
  });

  it('records history newest first', () => {
    press('Two', 'Add', 'Three', 'Equals', 'All clear', 'Four', 'Multiply', 'Five', 'Equals');
    expect(history()).toEqual([
      { expression: '4 × 5 =', result: '20' },
      { expression: '2 + 3 =', result: '5' },
    ]);
  });

  it('records the intermediate step of a chained expression', () => {
    press('Two', 'Add', 'Three', 'Add', 'Four', 'Equals');
    expect(history()).toEqual([
      { expression: '5 + 4 =', result: '9' },
      { expression: '2 + 3', result: '5' },
    ]);
  });

  it('clears the current calculation without touching history', () => {
    press('Two', 'Add', 'Three', 'Equals', 'Seven', 'All clear');
    expect(display()).toBe('0');
    expect(history().length).toBe(1);
  });

  it('clears history on request', () => {
    press('Two', 'Add', 'Three', 'Equals');
    expect(history().length).toBe(1);

    click('Clear history');
    expect(history()).toEqual([]);
  });

  it('accepts the same input from the keyboard', () => {
    type(['7', '*', '8', 'Enter']);
    expect(display()).toBe('56');

    type(['Escape']);
    expect(display()).toBe('0');

    type(['9', '/', '3', '=']);
    expect(display()).toBe('3');
  });

  it('cancels the browser default for handled keys', () => {
    const event = new KeyboardEvent('keydown', { key: '7', bubbles: true, cancelable: true });
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });

  it('ignores modified keystrokes and unmapped keys', () => {
    type(['q', 'F1']);
    expect(display()).toBe('0');

    window.dispatchEvent(
      new KeyboardEvent('keydown', { key: '7', ctrlKey: true, bubbles: true, cancelable: true }),
    );
    fixture.detectChanges();
    expect(display()).toBe('0');
  });
});