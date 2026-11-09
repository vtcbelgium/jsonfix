# JSONFix

[![Live Site](https://img.shields.io/badge/Live_Tool-jsonfix.othrys.be-0284c7?style=flat-square)](https://jsonfix.othrys.be)
[![Privacy](https://img.shields.io/badge/Privacy-100%25_Client--Side-16a34a?style=flat-square)](https://jsonfix.othrys.be)
[![Cookies](https://img.shields.io/badge/Cookies-0-blue?style=flat-square)](https://jsonfix.othrys.be)
[![WCAG AA](https://img.shields.io/badge/Accessibility-WCAG_AA-blueviolet?style=flat-square)](https://jsonfix.othrys.be)
[![License: MIT](https://img.shields.io/badge/License-MIT-gray?style=flat-square)](LICENSE)

> Fast, private, client-side client-side malformed JSON fixer and CSV exporter. Runs 100% in your browser with zero server uploads, zero cookies, and zero tracking.

## Features
- **100% Client-Side:** Files and confidential data never leave your device.
- **Zero Cookies & Zero Trackers:** Closed-valve privacy architecture with 0 third-party telemetry scripts.
- **Keyboard Spotlight:** Jump to any of the 20 sovereign tools anytime by pressing <kbd>⌘K</kbd> or <kbd>Ctrl+K</kbd>.
- **PWA Ready:** Works offline on laptops, MacBooks, tablets, and mobile devices.

## Direct Web Access
Use the live tool instantly without installing anything:
[https://jsonfix.othrys.be](https://jsonfix.othrys.be)


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
