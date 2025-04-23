import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';

export default [
  // JavaScript bundle
  {
    input: 'src/index.ts',
    output: [
      {
        file: 'dist/index.js',
        format: 'esm',
        sourcemap: true,
      },
    ],
    external: [
      'axios',
      '@iden3/js-crypto',
      '@keyringnetwork/circuits',
      '@keyringnetwork/circuits/circuit',
      '@keyringnetwork/circuits/crypto',
      '@keyringnetwork/circuits/domainobjs',
      '@keyringnetwork/circuits/utils',
      'ffjavascript',
      'snarkjs',
      'viem',
    ],
    plugins: [
      resolve(),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
      }),
    ],
  },
  // Type definitions bundle
  {
    input: 'src/index.ts',
    output: [{ file: 'dist/index.d.ts', format: 'esm' }],
    plugins: [dts()],
  },
]; 