# brease-next

A simple npm package for Next.js projects that provides a hello world function.

## Installation

For local development, you can install this package directly from the file system:

```bash
npm install /path/to/brease-next
```

Or if published to npm:

```bash
npm install brease-next
```

## Usage

### ES Modules (Next.js App Router, modern projects)

```typescript
import { hello } from 'brease-next';

console.log(hello()); // "Hello world"
```

Or using the default export:

```typescript
import hello from 'brease-next';

console.log(hello()); // "Hello world"
```

### CommonJS (legacy projects)

```javascript
const { hello } = require('brease-next');

console.log(hello()); // "Hello world"
```

## API

### `hello()`

Returns a greeting string.

**Returns:** `string` - Returns "Hello world"

**Example:**

```typescript
import { hello } from 'brease-next';

const greeting = hello();
console.log(greeting); // "Hello world"
```

## Development

### Building

```bash
npm run build
```

This will:
1. Clean the `dist` folder
2. Build CommonJS version (`index.js`)
3. Build ES Module version (`index.mjs`)
4. Generate TypeScript type declarations (`index.d.ts`)

### Scripts

- `npm run build` - Build both CommonJS and ESM versions
- `npm run build:cjs` - Build CommonJS version only
- `npm run build:esm` - Build ES Module version only
- `npm run clean` - Remove the dist folder

## Package Structure

```
brease-next/
├── src/
│   └── index.ts          # Source TypeScript file
├── dist/                 # Built files (generated)
│   ├── index.js          # CommonJS build
│   ├── index.mjs         # ES Module build
│   ├── index.d.ts        # TypeScript declarations
│   ├── index.d.ts.map    # Type declaration source map
│   └── index.js.map      # Source map
├── package.json
├── tsconfig.json
├── .gitignore
├── .npmignore
└── README.md
```

## TypeScript Support

This package includes TypeScript type declarations out of the box. TypeScript projects will automatically get type information and autocomplete.

## Requirements

- Node.js >= 16.0.0

## License

ISC
