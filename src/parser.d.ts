export function parse(input: string): import('./Ast').Ast;
export function toJSON(ast: Ast): import('./Ast').Concrete;
export function simplify(ast: Ast): import('./Ast').Simplified;
export function tokenise(source: string[]): Token[];
export type Ast = import('./Ast').Ast;
export type IMeta = import('./Ast').IMeta;
export type Token = import('./Token.js').Token;
