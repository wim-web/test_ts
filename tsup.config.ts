import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/**/*.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    outDir: 'dist',
    splitting: false,
    sourcemap: true,
    clean: true,
});
