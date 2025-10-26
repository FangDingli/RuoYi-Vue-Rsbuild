## 主要修改：
1. 将项目模块系统修改为 ESM
2. 构建工具修改为 `rsbuild`
3. 移除不需要的依赖项
4. 原项目中部分组件使用的 `import path from 'path'` 已无法使用，替换为 Ruoyi-Vue3 使用的 getNormalPath
5. 使用 [vueuse](https://vueuse.org/) 的 `useFullscreen` 替代 `screenfull.js`
6. vueuse 从 v12 开始不支持 vue2，所以此项目中的 vueuse 请不要升级
7. scss 文件改为新版本写法， @import 改为 @use, 涉及导出的将文件名修改为 *.module.scss