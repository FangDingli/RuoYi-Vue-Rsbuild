import { defineConfig, loadEnv } from '@rsbuild/core'
import { pluginVue2 } from '@rsbuild/plugin-vue2'
import path from 'path'
import { pluginSass } from '@rsbuild/plugin-sass'
import { pluginSvgSpriteLoader } from 'rsbuild-svg-sprite-loader'

function rootPath(dir) {
  let currentDir = new URL('.', import.meta.url).pathname
  return path.join(currentDir, dir)
}

export default defineConfig(({ env, command, envMode }) => {
  const currEnv = loadEnv({ prefixes: ['VUE_APP_'] })

  const { VUE_APP_BASE_API, VUE_APP_TITLE } = currEnv.parsed

  const htmlDefaultTitle = VUE_APP_TITLE || '若依管理系统'

  return {
    plugins: [
      pluginVue2(),
      pluginSass(),
      pluginSvgSpriteLoader({
        path: './src/assets/icons',
        symbolId: 'icon-[name]',
      }),
    ],
    source: {
      entry: {
        index: './src/main.js',
      },
      define: {
        process: JSON.stringify({
          env: currEnv.publicVars,
          platform: 'browser',
        }),
        'process.env': JSON.stringify({
          ...currEnv.parsed,
          NODE_ENV: process.env.NODE_ENV || 'development',
        }),
      },
    },
    html: {
      template: './public/index.html',
      templateParameters: {
        htmlDefaultTitle,
      },
    },
    server: {
      port: 3006,
      proxy: {
        [VUE_APP_BASE_API]: {
          target: 'http://localhost:8080',
          changeOrigin: true,
          pathRewrite: p => p.replace(VUE_APP_BASE_API, ''),
        },
      },
    },
    output: {},
    resolve: {
      alias: {
        '@': './src',
      },
      extensions: ['.ts', '.tsx', '.mjs', '.js', '.jsx', '.json', '.vue'],
    },
  }
})
