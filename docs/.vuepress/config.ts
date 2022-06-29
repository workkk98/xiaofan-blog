import type { DefaultThemeData } from '@vuepress/theme-default'
import { path } from '@vuepress/utils'

const turple2SidebarItem = (turple: string[]) => {
  return {
    text: turple[1],
    link: turple[0]
  }
}

const plugins = [
  // [
  //   '@vuepress/register-components',
  //   {
  //     components: {
  //       Home: path.resolve(__dirname, './components/Home.vue'),
  //     },
  //   }
  // ]
  [
    '@vuepress/plugin-google-analytics',
    {
      id: 'G-0WXGVLRBHZ'
    }
  ]
]

const defaultThemConfig: DefaultThemeData = {
  navbar: [
    { text: 'Home', link: '/' },
    { text: 'Github主页', link: 'https://github.com/workkk98'}
  ],
  sidebar: [
    {
      collapsible: false,
      text: '介绍',
      link: '/guide/'
    },
    {
      collapsible: false,
      text: 'npm',   // 必要的
      link: '/npm/',      // 可选的, 标题的跳转链接，应为绝对路径且必须存在
      // collapsable: false, // 可选的, 默认值是 true,
      children: [
        ['/npm/npm-scripts', 'npm-scripts']
      ].map(turple2SidebarItem)
    },
    {
      text: 'vue',   // 必要的
      link: '/vue/',      // 可选的, 标题的跳转链接，应为绝对路径且必须存在
      collapsable: false, // 可选的, 默认值是 true,
      children: [
        ['/vue/renderwatcher', '渲染观察者'],
        ['/vue/VNode_DOM', '从VNode到DOM'],
        ['/vue/createComponent', '创建子组件'],
        ['/vue/vue-hot-reload-api', 'vue-loader是如何支持热更新的']
      ].map(turple2SidebarItem)
    },
    {
      text: '随笔',   // 必要的
      link: '/others/',      // 可选的, 标题的跳转链接，应为绝对路径且必须存在
      collapsable: false, // 可选的, 默认值是 true,
      children: [
        ['/others/github-actions', 'github actions'],
        ['/others/How-To-Read-ECMAScript-spec', '如何阅读ECMAScript规范'],
        ['/others/nginx', 'nginx使用手册'],
        ['/others/abstract-comparison', '从ECMAScript规范来看相等操作符']
      ].map(turple2SidebarItem)
    },
    {
      text: '函数式编程',
      link: '/functional-programming/',
      collapsable: false, // 可选的, 默认值是 true,
      children: [
        ['/functional-programming/chapter-1', '第一章'],
      ].map(turple2SidebarItem)
    }
  ],
  lastUpdated: true
}

export default {
  title: '前端之旅',
  description: '博客',
  // theme: '@vuepress/theme-default',
  themeConfig: defaultThemConfig,
  base: '/blog/',
  plugins
}