module.exports = {
  title: "Venture",
  description:
    "A package to manage complex workflows built on top off Laravel's queue.",

  head: [
    [
      "link",
      {
        rel: "apple-touch-icon",
        sizes: "180x180",
        href: "/apple-touch-icon.png",
      },
    ],
    [
      "link",
      {
        rel: "icon",
        type: "image/png",
        sizes: "32x32",
        href: "/favicon-32x32.png",
      },
    ],
    [
      "link",
      {
        rel: "icon",
        type: "image/png",
        sizes: "16x16",
        href: "/favicon-16x16.png",
      },
    ],
    ["link", { rel: "manifest", href: "/site.webmanifest" }],
    [
      "link",
      { rel: "mask-icon", href: "/safari-pinned-tab.svg", color: "#3a0839" },
    ],
    ["link", { rel: "shortcut icon", href: "/favicon.ico" }],
    ["meta", { name: "msapplication-TileColor", content: "#3a0839" }],
    ["meta", { name: "msapplication-config", content: "/browserconfig.xml" }],
    ["meta", { name: "theme-color", content: "#ffffff" }],
  ],

  themeConfig: {
    repo: "ksassnowski/venture",
    docsRepo: "ksassnowski/venture-docs",
    logo: "/logo.svg",

    algolia: {
      apiKey: "aaf12df2ddf34696e87f6ae1f8e5cfe3",
      indexName: "laravel_venture",
    },

    sidebar: [
      {
        title: "Package",
        collapsable: false,
        children: [
          ["/", "Introduction"],
          ["/upgrade-guide", "Upgrade Guide"],
          ["/installation", "Installation"],
        ],
      },
      {
        title: "Usage",
        collapsable: false,
        children: [
          ["/usage/preparing-your-jobs", "Preparing your jobs"],
          ["/usage/configuring-workflows", "Configuring workflows"],
          ["/usage/duplicate-jobs", "Using multiple instances of the same job"],
          ["/usage/nesting-workflows", "Nesting workflows"],
          ["/usage/keeping-track-of-workflows", "Keeping track of workflows"],
          ["/usage/dealing-with-errors", "Dealing with errors"],
        ],
      },
      {
        title: "Testing",
        collapsable: false,
        children: [
          ["/testing/introduction", "Introduction"],
          [
            "/testing/testing-workflow-definitions",
            "Testing workflow definitions",
          ],
          [
            "/testing/asserting-that-workflows-were-started",
            "Asserting that a workflow was started",
          ],
        ],
      },
      {
        title: "Hooks",
        collapsable: false,
        children: [
          ["/hooks/before-create", "Modifying workflows before they get saved"],
        ],
      },
      {
        title: "Configuration",
        collapsable: false,
        children: [
          ["/configuration/table-names", "Changing the table names"],
          [
            "/configuration/customizing-the-migrations",
            "Customizing the migrations",
          ],
        ],
      },
    ],
  },
};
