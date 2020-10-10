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
        ],
      },
      {
        title: "Usage",
        collapsable: false,
        children: [
          ["/usage/preparing-your-jobs", "Preparing your jobs"],
          ["/usage/configuring-workflows", "Configuring workflows"],
          ["/usage/keeping-track-of-workflows", "Keeping track of workflows"],
          ["/usage/dealing-with-errors", "Dealing with errors"],
          ["/usage/caveats-and-limitations", "Caveats and limitations"],
        ],
      },
      {
        title: "Configuration",
        collapsable: false,
        children: [
          ["/configuration/table-names", "Changing the table names"],
        ],
      },
    ],
  },
};
