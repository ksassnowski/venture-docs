module.exports = {
  title: "Laravel Workflow",
  description: "Crazy workflows, oida.",

  themeConfig: {
    repo: "ksassnowski/laravel-workflow",
    docsRepo: "ksassnowski/laravel-workflow-docs",

    sidebar: [
      {
        title: "Package",
        collapsable: false,
        children: [
          ["/", "Introduction"],
          ["/installation", "Installation"],
        ],
      },
      {
        title: "Usage",
        collapsable: false,
        children: [
          ["/usage/", "Preparing your jobs"],
          ["/usage/configuring-workflows", "Configuring workflows"],
          ["/usage/keeping-track-of-workflows", "Keeping track of workflows"],
          ["/usage/caveats-and-limitations", "Caveats and limitations"],
        ],
      },
    ],
  },
};
