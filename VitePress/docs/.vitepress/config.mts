import { defineConfig } from 'vitepress'
import mathjax3 from 'markdown-it-mathjax3'

export default defineConfig({
  base: '/Documents/',

  title: 'Documents',
  description: 'My notes and docs',

  markdown: {
    config: (md) => {
      md.use(mathjax3)
    }
  },

  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'GitHub', link: 'https://github.com/curnature/Documents' }
    ],

    sidebar: [
      {
        text: 'Start here',
        items: [{ text: 'Getting started', link: '/guide/getting_started' }]
      },

      {
        text: 'Build an VPS server', 
        link: '/vps_build/', 
        items: [
          {text: 'Users', link: '/vps_build/01_users'},
          {text: 'Nginx', link: '/vps_build/02_nginx'},
          {text: 'Cert', link: '/vps_build/03_cert'},
          {text: 'HTTPS', link: '/vps_build/04_https'}
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/curnature' }
    ]
  }
})
