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
        children: [["/configuration/table-names", "Changing the table names"]],
      },
    ],
  },
};
