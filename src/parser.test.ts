import { parse, simplify, toJSON } from './parser';

describe('atoms', () => {
  it('reads numbers', () => {
    expect(simplify(parse('0.99'))).toBe(0.99);
    expect(simplify(parse('1.23'))).toBe(1.23);
    expect(simplify(parse('-1.23'))).toBe(-1.23);
  });

  it('reads strings', () => {
    expect(simplify(parse('"fart \\tbutt\\npoop"'))).toEqual({
      $string: 'fart \tbutt\npoop',
    });
  });

  it('reads-symbols', () => {
    expect(simplify(parse('--butt-smells?'))).toBe('--butt-smells?');
  });
});

describe('simple programs', () => {
  it('reads a factorial', () => {
    const ast = parse(`
      ;;; fact (n): calculate the factorial n!
      (define (fact n)
          (if (< n 2)
              n
              ;; this isn't stack-safe tail-recursion
              (* n (fact (- n 1)))))
    `);

    expect(toJSON(ast)).toMatchSnapshot();
    expect(simplify(ast)).toMatchSnapshot();
  });

  it('reads a quoted expression', () => {
    const ast = parse(`'(expr 1 + 1)`);
    expect(simplify(ast)).toMatchSnapshot();
  });

  it('reads a quasi-quoted expression', () => {
    const ast = parse('`(expr 1 + 1)');
    expect(simplify(ast)).toMatchSnapshot();
  });

  it('reads an quasi-quoted expression with an unquote', () => {
    const ast = parse('`(,expr 1 + 1)');
    expect(simplify(ast)).toMatchSnapshot();
  });
});
