import { Ast, Concrete, Simplified, IMeta } from './Ast.js';
import { Token } from './Token.js';

const stringNode =
  (value: string, meta: IMeta): Ast =>
  (alg) =>
    alg.string(value, meta);

const numberLiteral =
  (value: number, meta: IMeta): Ast =>
  (alg) =>
    alg.number(value, meta);

const list =
  (value: Ast[], meta: IMeta): Ast =>
  (alg) =>
    alg.list(
      value.map((f) => f(alg)),
      meta
    );

const symbol =
  (name: string, meta: IMeta): Ast =>
  (alg) =>
    alg.symbol(name, meta);

export const parse = (input: string) => {
  // this is the easiest way to iterate over unicode codepoints
  // it's not especially efficient
  const source = Array.from(input);
  const tokens = tokenise(source);

  const parse = (index: number): { index: number; ast: Ast } => {
    const { start, end, comments, type } = tokens[index];
    const text = source.slice(start, end).join('');
    const meta = { location: { start, end }, comments };

    switch (type) {
      case 'Number': {
        const value = parseFloat(text);
        const ast = numberLiteral(value, meta);

        return { index: index + 1, ast };
      }

      case 'String': {
        try {
          const value = JSON.parse(text);
          const ast = stringNode(value, meta);

          return { index: index + 1, ast };
        } catch (e) {
          throw new Error(`Invalid text: ${text}`);
        }
      }

      case 'Symbol': {
        const ast = symbol(text, meta);
        return { index: index + 1, ast };
      }

      case 'OpenParen': {
        const nodes = [];

        for (let i = index + 1; i < tokens.length; ) {
          if (tokens[i].type === 'CloseParen') {
            const meta = {
              location: {
                start,
                end: tokens[i].end,
              },
              comments,
            };

            const ast = list(nodes, meta);
            return { index: i + 1, ast };
          }

          const result = parse(i);
          i = result.index;
          if (typeof result.ast !== 'function') {
            throw new Error(`What the fuck? ${result.ast}`);
          }
          nodes.push(result.ast);
        }

        throw new Error(
          `Missing matching paren for opening paren at @ ${start}`
        );
      }

      case 'Quote': {
        const result = parse(index + 1);
        const ast = list([symbol('quote', meta), result.ast], meta);
        return { index: result.index + 1, ast };
      }

      case 'Unquote': {
        const result = parse(index + 1);
        const ast = list([symbol('unquote', meta), result.ast], meta);
        return { index: result.index + 1, ast };
      }

      case 'Quasiquote': {
        const result = parse(index + 1);
        const ast = list([symbol('quasiquote', meta), result.ast], meta);
        return { index: result.index + 1, ast };
      }

      case 'CloseParen':
        throw new Error(`Unexpected closing paren @ ${start}`);
    }
  };

  const { index, ast } = parse(0);
  if (index < tokens.length) {
    const end = tokens[index].end;
    throw new Error(`Unexpected at ${end}: ${source.slice(end, end + 10)}`);
  }

  return ast;
};

export const toJSON = (ast: Ast): Concrete =>
  ast({
    list: (value, meta) => ({ type: 'List', value, meta }),
    symbol: (value, meta) => ({ type: 'Symbol', value, meta }),
    number: (value, meta) => ({ type: 'Number', value, meta }),
    string: (value, meta) => ({ type: 'String', value, meta }),
  });

export const simplify = (ast: Ast): Simplified =>
  ast({
    list: (value) => value,
    symbol: (value) => value,
    number: (value) => value,
    string: (value) => ({ $string: value }),
  });

interface IInput {
  source: string[];
  index: number;
}

interface IInputComments extends IInput {
  comments: string[];
}

export const tokenise = (source: string[]): Token[] => {
  let index = 0;
  const tokens = [] as Token[];
  let comments = [] as string[];

  index = skipWhitespace({ source, index, comments });
  while (index < source.length) {
    if (
      source[index] === '-' &&
      source.length > index + 1 &&
      isDigit(source[index + 1])
    ) {
      const next = readNumber({ source, index: index + 1 });
      if (next === -1) {
        throw new Error(`Failed to read number @ ${index}`);
      }
      tokens.push({ type: 'Number', start: index, end: next, comments });
      comments = [];
      index = next;
    } else if (isDigit(source[index])) {
      const next = readNumber({ source, index });
      if (next === -1) {
        throw new Error(`Failed to read number @ ${index}`);
      }
      tokens.push({ type: 'Number', start: index, end: next, comments });
      comments = [];
      index = next;
    } else if (source[index] === '"') {
      const next = skipString({ source, index });
      if (next === -1) {
        throw new Error(`Failed to read string @ ${index}`);
      }

      tokens.push({ type: 'String', start: index, end: next, comments });
      comments = [];
      index = next;
    } else if (source[index] === '(') {
      const next = index + 1;
      tokens.push({ type: 'OpenParen', start: index, end: next, comments });
      comments = [];
      index = next;
    } else if (source[index] === ')') {
      const next = index + 1;
      tokens.push({ type: 'CloseParen', start: index, end: next, comments });
      comments = [];
      index = next;
    } else if (source[index] === "'") {
      const next = index + 1;
      tokens.push({ type: 'Quote', start: index, end: next, comments });
      comments = [];
      index = next;
    } else if (source[index] === '`') {
      const next = index + 1;
      tokens.push({ type: 'Quasiquote', start: index, end: next, comments });
      comments = [];
      index = next;
    } else if (source[index] === ',') {
      const next = index + 1;
      tokens.push({ type: 'Unquote', start: index, end: next, comments });
      comments = [];
      index = next;
    } else {
      const next = skipSymbol({ source, index });
      if (next === -1) {
        throw new Error(`Failed to read symbol @ ${index}`);
      }
      tokens.push({ type: 'Symbol', start: index, end: next, comments });
      comments = [];
      index = next;
    }

    index = skipWhitespace({ source, index, comments });
  }

  return tokens;
};

const readNumber = ({ source, index }: IInput): number => {
  // number := "0"
  //        := "0." digits
  //        := [1-9] digits
  //        := [1-9] digits "." digits
  if (source[index] === '0') {
    index++;
    if (source[index] === '.') {
      index++;
      while (isDigit(source[index])) {
        index++;
      }
      return index;
    }

    return index;
  }

  if (!isDigit(source[index])) {
    return -1;
  }

  while (isDigit(source[index])) {
    index++;
  }

  if (source[index] !== '.') {
    return index;
  }

  index++;
  while (isDigit(source[index])) {
    index++;
  }
  return index;
};

/**
 *
 * @param {string} ch
 * @returns {boolean}
 */
const isDigit = (ch: string) => {
  switch (ch) {
    case '0':
    case '1':
    case '2':
    case '3':
    case '4':
    case '5':
    case '6':
    case '7':
    case '8':
    case '9':
      return true;

    default:
      return false;
  }
};

const skipWhitespace = ({
  source,
  index,
  comments,
}: IInputComments): number => {
  for (; index < source.length; index++) {
    switch (source[index]) {
      case '\t':
      case '\n':
      case '\r':
      case ' ':
        break;

      case ';': {
        let end = source.indexOf('\n', index);
        comments.push(source.slice(index, end).join('')); // T
        index = end;
        break;
      }

      default:
        return index;
    }
  }

  return index;
};

const skipString = ({ source, index }: IInput) => {
  if (source[index] !== '"') {
    return -1;
  }

  index++;
  for (; index < source.length; index++) {
    switch (source[index]) {
      case '"':
        return index + 1;

      case '\\':
        // TODO: handle \u{} and \x
        index++;
        switch (source[index]) {
          case 't':
          case 'n':
          case 'h':
            index++;
            break;
          case 'u':
            index += 5;
            break;
          default:
            throw new Error(`Fuck bro, idk`);
        }
        break;

      default:
        break;
    }
  }

  return -1; // unexpected end-of-input during string literal
};

const skipSymbol = ({ source, index }: IInput) => {
  for (; index < source.length; index++) {
    switch (source[index]) {
      case '"':
      case ';':
      case ')':
      case '(':
      case '\t':
      case '\n':
      case '\r':
      case ' ':
        return index;

      default:
        break;
    }
  }

  return index;
};
