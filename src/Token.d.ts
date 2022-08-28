export type Token = {
  type:
    | 'String'
    | 'Number'
    | 'Symbol'
    | 'OpenParen'
    | 'CloseParen'
    | 'Quasiquote'
    | 'Quote'
    | 'Unquote';
  start: number;
  end: number;
  comments: string[];
};
