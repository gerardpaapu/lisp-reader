export interface ILocation {
  start: number;
  end: number;
}

export interface IMeta {
  location: ILocation;
  comments: string[];
}

export interface IAstAlg<r> {
  number(value: number, meta: IMeta): r;
  string(value: string, meta: IMeta): r;
  symbol(value: string, meta: IMeta): r;
  list(value: r[], meta: IMeta): r;
}

export type Ast = <r>(alg: IAstAlg<r>) => r;

export type Simplified = number | string | { $string: string } | Simplified[];

export type Concrete =
  | { type: 'String'; value: string; meta: IMeta }
  | { type: 'Number'; value: number; meta: IMeta }
  | { type: 'List'; value: Concrete[]; meta: IMeta }
  | { type: 'Symbol'; value: string; meta: IMeta };
