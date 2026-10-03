import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'MossyMC',
  description: 'MossyMC 玩法文档',
  lang: 'zh-CN',
  lastUpdated: true,
  cleanUrls: true,
  // 自定义域名 www.mossymc.top，base 设为 '/'
  base: '/',

  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '指南', link: '/guide/getting-started' },
      { text: '规则', link: '/rules' },
      { text: 'FAQ', link: '/faq' },
      { text: '功能合集', link: '/tools.html' },
      { text: '经典版', link: '/site/index.html' }
    ],

    sidebar: {
      '/guide/': [
        {
          text: '入门',
          items: [
            { text: '新手入门', link: '/guide/getting-started' },
            { text: '核心玩法', link: '/guide/gameplay' },
            { text: '常用命令', link: '/guide/commands' }
          ]
        }
      ],
      '/rules': [
        {
          text: '参考',
          items: [
            { text: '服务器规则', link: '/rules' },
            { text: '常见问题', link: '/faq' }
          ]
        }
      ]
    },

    footer: {
      message: '© 2026 MossyMC',
      copyright: '苔生方块，致敬无限创造'
    },

    outline: { label: '本页目录' },
    lastUpdated: { text: '最后更新' },
    docFooter: { prev: '上一页', next: '下一页' },
    darkModeSwitchLabel: '主题',
    sidebarMenuLabel: '菜单',
    returnToTopLabel: '回到顶部',
    langMenuLabel: '语言',

    socialLinks: [
      { icon: 'github', link: 'https://github.com/' }
    ]
  }
})
