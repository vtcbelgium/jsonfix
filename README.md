# JSONFix

> Independent OTHRYS utility one-pager: 100% in-browser JSON repair, formatter, validator, and minifier.

## Features

- Repairs trailing commas in objects and arrays.
- Converts single-quoted strings to double quotes.
- Wraps unquoted property names in double quotes.
- Converts Python literals (`True`, `False`, `None`) to `true`, `false`, `null`.
- Strips trailing semicolons.
- Formats (pretty-print) and minifies output.
- 100% Client-side: zero server roundtrips, zero telemetry.

## Development

```bash
npm install
npm test
npm run typecheck
npm run build
npm run dev
```
