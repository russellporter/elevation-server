# Development Guidelines for Elevation Server

## Commands
* Build: `npm run build`
* Lint/Typecheck: `npm run lint`
* Run server: `npm run serve` or `npm run start`
* Debug mode: `npm run debug`
* Watch mode: `npm run watch`
* Run tests: `test/integration-test.sh`

## Code Style
* TypeScript with strict mode and no implicit any
* 2-space indentation, double quotes, semicolons
* Follow standard TypeScript naming conventions (camelCase for variables/functions, PascalCase for classes/interfaces)
* Descriptive type definitions, avoid explicit `any`
* Organize imports on save
* Error handling: use proper TypeScript error handling patterns
* Functions should have specific return types when non-obvious

## Project Structure
* `/src` - Source code
* `/test` - Test files
* `src/util` - Utility functions and shared code

Always run `npm run lint` before committing changes.