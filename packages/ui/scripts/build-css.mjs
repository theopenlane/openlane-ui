// Compiles src/styles.css into a complete, self-contained dist/styles.css.
//
// tsup (esbuild) alone cannot do this: esbuild's built-in CSS bundling only inlines @import
// statements as static text, and Tailwind v4 ships its "tailwindcss" package entry as
// `@import "tailwindcss"` pulling in preflight/theme, plus a literal `@tailwind utilities;`
// placeholder in utilities.css - no actual utility classes are generated without running the real
// Tailwind engine (the @tailwindcss/postcss plugin), which scans `@source` paths for class names
// actually used. So this package's build runs postcss with the same plugin config already declared
// in postcss.config.mjs (reused here, not duplicated) as a separate step from the JS/DTS bundle.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { transform } from 'esbuild'
import postcss from 'postcss'
import postcssConfig from '../postcss.config.mjs'

const ROOT = new URL('..', import.meta.url).pathname
const SOURCE = `${ROOT}src/styles.css`
const OUT_DIR = `${ROOT}dist`
const OUT_FILE = `${OUT_DIR}/styles.css`

const plugins = await Promise.all(
  Object.entries(postcssConfig.plugins).map(async ([name, options]) => {
    const mod = await import(name)
    const factory = mod.default ?? mod
    return factory(options)
  }),
)

const css = readFileSync(SOURCE, 'utf-8')
const result = await postcss(plugins).process(css, { from: SOURCE, to: OUT_FILE })

for (const warning of result.warnings()) {
  console.warn(`[build-css] ${warning.toString()}`)
}

const minified = await transform(result.css, { loader: 'css', minify: true })

mkdirSync(OUT_DIR, { recursive: true })
writeFileSync(OUT_FILE, minified.code)

console.log(`[build-css] wrote ${OUT_FILE} (${(minified.code.length / 1024).toFixed(1)} KB minified, ${(result.css.length / 1024).toFixed(1)} KB unminified)`)
