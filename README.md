# Lisp Reader

Reads a simple lisp-like syntax.

It is intended for educational use and probably isn't especially fast.

## Simplified AST

```js
import { parse } from '@donothing/lisp-reader';

const ast = parse(`
;;; (fact n) calculate n!
(define (fact n)
  (if (< n 2)
      1
      ;; this isn't stack-safe because I have no morals
      (* (fact (- n 1)) n)))
`)

console.log(ast)
```

Will log something like this (I've formatted it to match the input).

```json
["define", ["fact", "n"] 
  , ["if", ["<", "n", 2]
       , 1
       , ["*", ["fact", ["-", "n", 1]]
             , "n"]]]
```

## Concrete tree

The concrete tree includes location information and attaches comments to the nodes that follow them

```js
import { parseConcrete } from '@donothing/lisp-reader';

const ast = parseConcrete(`
;;; (fact n) calculate n!
(define (fact n)
  (if (< n 2)
      1
      ;; this isn't stack-safe because I have no morals
      (* (fact (- n 1)) n)))
`)

console.log(ast)
```

Will log something like this

```
{
  type: 'List',
  value: [
    { type: 'Symbol', value: 'define', meta: [Object] },
    { type: 'List', value: [Array], meta: [Object] },
    { type: 'List', value: [Array], meta: [Object] }
  ],
  meta: {
    location: { start: 27, end: 150 },
    comments: [ ';;; (fact n) calculate n!' ]
  }
}
```