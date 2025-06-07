import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/app/wsjf-webcomponent.tsx'],
  format: ['esm', 'cjs', 'iife'],
  dts: false,
  outDir: 'dist',
  minify: true,
  sourcemap: true,
  clean: true,
  target: 'es2017',
  shims: false,
  splitting: false,
  skipNodeModulesBundle: true,
  define: {
    'process.env.NODE_ENV': '"production"',
    'process.env': '{}',
    'process': '{}',
  },
  esbuildOptions(options: any) {
    options.banner = {
      js: '/* WSJF Web Component */',
    };
    options.inject = [];
    options.platform = 'browser';
  },
});
