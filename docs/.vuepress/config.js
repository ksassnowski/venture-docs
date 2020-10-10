module.exports = {
  title: "Venture",
  description: "A package to manage complex workflows built on top off Laravel's queue.",

  themeConfig: {
    repo: "ksassnowski/venture",
    docsRepo: "ksassnowski/venture-docs",

    sidebar: [
      {
        title: "Package",
        collapsable: false,
        children: [
          ["/", "Introduction"],
          ["/installation", "Installation"],
          ["/should-you-use-venture", "Should you use Venture?"],
        ],
      },
      {
        title: "Usage",
        collapsable: false,
        children: [
          ["/usage/preparing-your-jobs", "Preparing your jobs"],
          ["/usage/configuring-workflows", "Configuring workflows"],
          ["/usage/keeping-track-of-workflows", "Keeping track of workflows"],
          ["/usage/caveats-and-limitations", "Caveats and limitations"],
        ],
      },
    ],
  },
};
