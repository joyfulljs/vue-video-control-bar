import resolve from '@rollup/plugin-node-resolve'
import VuePlugin from 'rollup-plugin-vue'

export default [{
  input: './index.js',
  plugins: [
    resolve(),
    VuePlugin({ css: true })
  ],
  output: [{
    file: 'demo/index.js',
    format: 'iife',
  }]
}];