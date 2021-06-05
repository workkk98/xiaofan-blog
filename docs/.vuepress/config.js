module.exports = {
  title: '小凡的博客',
  description: '博客',
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Github主页', link: 'https://github.com/workkk98'}
    ],
    sidebar: [
      {
        title: '介绍',
        path: '/guide/'
      },
      {
        title: 'npm',   // 必要的
        path: '/npm/',      // 可选的, 标题的跳转链接，应为绝对路径且必须存在
        collapsable: false, // 可选的, 默认值是 true,
        sidebarDepth: 1,    // 可选的, 默认值是 1,
        children: [
          ['/npm/npm-scripts', 'npm-scripts']
        ]
      },
      {
        title: 'vue',   // 必要的
        path: '/vue/',      // 可选的, 标题的跳转链接，应为绝对路径且必须存在
        collapsable: false, // 可选的, 默认值是 true,
        sidebarDepth: 1,    // 可选的, 默认值是 1,
        children: [
          ['/vue/renderwatcher', '渲染观察者'],
          ['/vue/VNode_DOM', '从VNode到DOM'],
          ['/vue/createComponent', '创建子组件']
        ]
      },
      {
        title: '随笔',   // 必要的
        path: '/others/',      // 可选的, 标题的跳转链接，应为绝对路径且必须存在
        collapsable: false, // 可选的, 默认值是 true,
        sidebarDepth: 1,    // 可选的, 默认值是 1,
        children: [
          ['/others/github-actions', 'github actions'],
        ]
      },
    ],
    lastUpdated: 'Last Updated'
  }
}