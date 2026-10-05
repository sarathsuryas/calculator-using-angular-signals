import {
  appendDigit,
  applyOperator,
  backspace,
  formatResult,
  HISTORY_LIMIT,
  operatorLabel,
  percent,
  toggleSign,
} from './calculator-logic';

describe('calculator-logic', () => {
  describe('applyOperator', () => {
    it('applies each operator', () => {
      expect(applyOperator(3, '+', 4)).toBe(7);
      expect(applyOperator(3, '-', 4)).toBe(-1);
      expect(applyOperator(3, '*', 4)).toBe(12);
      expect(applyOperator(3, '/', 4)).toBe(0.75);
    });
  });

  describe('formatResult', () => {
    it('trims floating point noise to 12 significant digits', () => {
      expect(formatResult(0.1 + 0.2)).toBe('0.3');
      expect(formatResult(1 / 3)).toBe('0.333333333333');
    });

    it('normalizes zero and negative zero', () => {
      expect(formatResult(0)).toBe('0');
      expect(formatResult(-0)).toBe('0');
    });

    it('reports non-finite results as an error', () => {
      expect(formatResult(1 / 0)).toBe('Error');
      expect(formatResult(NaN)).toBe('Error');
    });
  });

  describe('toggleSign', () => {
    it('flips the sign', () => {
      expect(toggleSign('5')).toBe('-5');
      expect(toggleSign('-5')).toBe('5');
    });

    it('keeps zero and error untouched', () => {
      expect(toggleSign('0')).toBe('0');
      expect(toggleSign('Error')).toBe('0');
    });
  });

  describe('percent', () => {
    it('divides by 100', () => {
      expect(percent('50')).toBe('0.5');
      expect(percent('200')).toBe('2');
    });
  });

  describe('appendDigit', () => {
    it('appends to a non-zero display', () => {
      expect(appendDigit('12', '3')).toBe('123');
    });

    it('replaces zero or an error', () => {
      expect(appendDigit('0', '5')).toBe('5');
      expect(appendDigit('Error', '5')).toBe('5');
    });
  });

  describe('backspace', () => {
    it('removes the last character', () => {
      expect(backspace('123')).toBe('12');
    });

    it('falls back to zero', () => {
      expect(backspace('1')).toBe('0');
      expect(backspace('')).toBe('0');
      expect(backspace('-')).toBe('0');
      expect(backspace('Error')).toBe('0');
    });
  });

  describe('operatorLabel', () => {
    it('uses printable glyphs', () => {
      expect(operatorLabel('*')).toBe('×');
      expect(operatorLabel('/')).toBe('÷');
      expect(operatorLabel('+')).toBe('+');
      expect(operatorLabel('-')).toBe('-');
    });
  });

  it('caps history at a fixed limit', () => {
    expect(HISTORY_LIMIT).toBe(50);
  });
});