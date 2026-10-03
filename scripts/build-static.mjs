/**
 * 把根目录的静态站与共享资源并入 VitePress 构建产物。
 *
 * 产物布局：
 *   /                     VitePress 首页（带 指南 / 规则 / FAQ 文档导航）
 *   /site/                根目录静态站（index.html + script.js + styles.css）
 *   /site/resource/       静态站相对引用的资源副本
 *   /resource/            共享资源，供 /psych.html、/cert.html 等根路径页面使用
 *   /psych.html /cert.html /tools.html
 *   /project.html /project.css /js/   英语学习页（拆分模块版，根目录为唯一来源）
 *
 * 为什么资源要放两份：
 *   静态站的 index.html 用 "resource/xxx" 相对路径，部署在 /site/ 下时
 *   会解析到 /site/resource/；而 /psych.html 等根路径页面用同样的相对
 *   写法，解析到 /resource/。两种都要存在，页面才不会 404。
 *
 * 本脚本随 `npm run docs:build` 自动执行，也可单独运行做本地验证：
 *   node scripts/build-static.mjs [产物目录]
 * 不传参数时使用 docs/.vitepress/dist，也可用环境变量 VITEPRESS_DIST 指定。
 */
import { cpSync, mkdirSync, copyFileSync, existsSync, statSync, rmSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const distArg = process.argv[2] || process.env.VITEPRESS_DIST || join('docs', '.vitepress', 'dist')
const dist = resolve(root, distArg)

if (!existsSync(dist) || !statSync(dist).isDirectory()) {
  console.error(`[build-static] 找不到构建产物目录：${dist}`)
  console.error('[build-static] 请先运行 `vitepress build docs`。')
  process.exit(1)
}

/** 复制单个文件，并确保目标目录存在。 */
function copy(src, dest) {
  const from = join(root, src)
  if (!existsSync(from)) {
    console.error(`[build-static] 缺少源文件：${src}`)
    process.exit(1)
  }
  mkdirSync(dirname(dest), { recursive: true })
  copyFileSync(from, dest)
  console.log(`[build-static] ${src} -> ${dest.slice(dist.length + 1)}`)
}

// 1) 共享资源放到站根，供根路径页面（psych.html / cert.html）相对引用
cpSync(join(root, 'resource'), join(dist, 'resource'), { recursive: true })
console.log('[build-static] resource/ -> resource/')

// 2) 静态站整体移到 /site/
const siteDir = join(dist, 'site')
mkdirSync(siteDir, { recursive: true })
for (const file of ['index.html', 'script.js', 'styles.css']) {
  copy(file, join(siteDir, file))
}

// 3) 静态站自身的相对资源引用（resource/...）在 /site/ 下需要一份副本
cpSync(join(root, 'resource'), join(siteDir, 'resource'), { recursive: true })
console.log('[build-static] resource/ -> site/resource/')

// 4) 共享工具页放到站根，与 tools.html 里的链接保持一致
for (const file of ['psych.html', 'cert.html', 'tools.html']) {
  copy(file, join(dist, file))
}

// 5) 英语学习页（project.html）已拆分为 html + project.css + js/ 模块，
//    根目录是唯一来源；docs/public 里的旧整页副本会被这里覆盖。
for (const file of ['project.html', 'project.css']) {
  copy(file, join(dist, file))
}
rmSync(join(dist, 'js'), { recursive: true, force: true })
cpSync(join(root, 'js'), join(dist, 'js'), { recursive: true })
console.log('[build-static] js/ -> js/')

// 6) 人格解析页部署 docs/public/test.html（其中资源引用写成 ../../resource/，
//    浏览器会把根之上的 .. 钳制掉，因此 /test.html 与 /test/ 两种访问方式都能命中）。
//    根目录那份 test.html 与它逐字节等价，仅少了 ../../ 前缀，作为源文件保留；
//    这里显式复制，既补齐 tools.html 的链接，也让它不再依赖 VitePress 的 public 目录约定。
copy(join('docs', 'public', 'test.html'), join(dist, 'test.html'))

console.log(`[build-static] 完成：静态站位于 /site/，工具页位于站根。`)
