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
          {text: 'Setup new users', link: '/vps_build/01_users'},
          {text: 'Nginx 101', link: '/vps_build/02_nginx'},
          {text: 'Get a certificate', link: '/vps_build/03_cert'},
          {text: 'From HTTP to HTTPS', link: '/vps_build/04_https'},
          {text: 'Xray 101', link: '/vps_build/05_xray'},
          {text: 'More on Xray - Reality', link: '/vps_build/06_reality'},
          {text: 'Check BBR', link: '/vps_build/07_bbr'},
          {text: 'More on Xray - Routing', link: '/vps_build/08_routing'},
          {text: 'More on Xray - Fallbacks', link: '/vps_build/09_fallbacks'},
          {text: 'Poor mans snapshots', link: '/vps_build/10_snapshot'}
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/curnature' }
    ]
  }
})
