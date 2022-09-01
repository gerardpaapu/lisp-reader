import { Simplified, Concrete } from './Ast.js';
import * as P from './parser.js';
export { Simplified, Concrete } from './Ast.js';

/**
 * Parses lisp expressions to a simplified format:
 *
 *   parse("(plus 12 3)") -> ['plus', 12, 3]
 *
 * Symbols are parsed to strings and string literals are wrapped in
 * an object. This is based on the assumption that most programs
 * have more symbols than string literals and overall it's better
 * to make string literals inconvenient.
 *
 *   parse('"An example string"') -> { $string: 'An example string' }
 *
 * String literals are read with `JSON.parse`.
 */
export const parse = (src: string): Simplified => P.simplify(P.parse(src));

/**
 * Parses lisp expressions to a concrete-tree that includes
 * location information and attaches comments to the nodes that
 * follow them.
 */
export const parseConcrete = (src: string): Concrete => P.toJSON(P.parse(src));
