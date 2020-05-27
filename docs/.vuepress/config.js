module.exports = {
  title: '小凡的博客',
  description: '博客',
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Github主页', link: 'https://github.com/workINgithub'}
    ],
    sidebar: [
      '/',
      {
        title: 'npm',   // 必要的
        // path: '/npm/',      // 可选的, 标题的跳转链接，应为绝对路径且必须存在
        collapsable: false, // 可选的, 默认值是 true,
        sidebarDepth: 1,    // 可选的, 默认值是 1,
        children: [
          ['/npm/npm-scripts', 'npm-scripts']
        ]
      },
    ],
    lastUpdated: 'Last Updated'
  }
}