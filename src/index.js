import * as P from './parser.js';

/** @typedef {import('./Ast').Simplified} Simplified */
/** @typedef {import('./Ast').Concrete} Concrete */

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
 *
 * @param {string} src
 * @returns {import('./Ast.js').Simplified}
 */
export const parse = (src) => P.simplify(P.parse(src));

/**
 * Parses lisp expressions to a concrete-tree that includes
 * location information and attaches comments to the nodes that
 * follow them.
 *
 * @param {string} src
 * @returns {import('./Ast.js').Concrete}
 */
export const parseConcrete = (src) => P.toJSON(P.parse(src));
