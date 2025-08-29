import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import { terser } from 'rollup-plugin-terser';
import dts from 'rollup-plugin-dts';

const production = !process.env.ROLLUP_WATCH;

const external = ['axios', 'react'];

const commonPlugins = [
  resolve({
    browser: true,
    preferBuiltins: false
  }),
  commonjs(),
  typescript({
    tsconfig: './tsconfig.json',
    declaration: false, // We handle declarations separately
    declarationMap: false
  })
];

export default [
  // ES Module build
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.esm.js',
      format: 'es',
      sourcemap: true
    },
    external,
    plugins: [
      ...commonPlugins,
      production && terser({
        compress: {
          drop_console: true
        }
      })
    ].filter(Boolean)
  },

  // CommonJS build
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.js',
      format: 'cjs',
      sourcemap: true,
      exports: 'named'
    },
    external,
    plugins: [
      ...commonPlugins,
      production && terser({
        compress: {
          drop_console: true
        }
      })
    ].filter(Boolean)
  },

  // UMD build for browsers
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.umd.js',
      format: 'umd',
      name: 'SimpleFACT',
      globals: {
        axios: 'axios',
        react: 'React'
      },
      sourcemap: true
    },
    external,
    plugins: [
      ...commonPlugins,
      production && terser({
        compress: {
          drop_console: true
        }
      })
    ].filter(Boolean)
  },

  // TypeScript declarations
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.d.ts',
      format: 'es'
    },
    external,
    plugins: [dts()]
  }
];
