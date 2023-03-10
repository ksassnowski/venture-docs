export default {
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
    [
      "script",
      {
        src: "https://station-to-station-sparkling.laravel-venture.com/script.js",
        "data-site": "UEEUNDDU",
        defer: true,
      },
    ],
  ],

  themeConfig: {
    repo: "ksassnowski/venture",
    docsRepo: "ksassnowski/venture-docs",
    logo: "/logo.svg",
    siteTitle: false,

    algolia: {
      appId: "F938IIKXFS",
      apiKey: "f7d5b3899217cf276ffb1dde445bf37c",
      indexName: "laravel-venture",
    },

    footer: {
      message: "Released under the MIT License.",
      copyright: "Made by Kai Sassnowski",
    },

    socialLinks: [
      { icon: "github", link: "https://github.com/ksassnowski/venture" },
    ],

    sidebar: [
      {
        text: "Package",
        collapsible: true,
        items: [
          { link: "/what-is-venture", text: "What is Venture?" },
          { link: "/upgrade-guide", text: "Upgrade Guide" },
          { link: "/installation", text: "Installation" },
        ],
      },
      {
        text: "Usage",
        collapsible: true,
        items: [
          {
            link: "/usage/preparing-your-jobs",
            text: "Preparing your jobs",
          },
          {
            link: "/usage/configuring-workflows",
            text: "Configuring workflows",
          },
          {
            link: "/usage/duplicate-jobs",
            text: "Using multiple instances of the same job",
          },
          {
            link: "/usage/nesting-workflows",
            text: "Nesting workflows",
          },
          {
            link: "/usage/keeping-track-of-workflows",
            text: "Keeping track of workflows",
          },
          { link: "/usage/dealing-with-errors", text: "Dealing with errors" },
        ],
      },
      {
        text: "Plugins",
        collapsible: true,
        items: [
          { link: "/plugins/writing-plugins", text: "Writing plugins" },
          {
            link: "/plugins/entity-aware-workflows",
            text: "Entity aware workflows",
          },
          {
            link: "/plugins/laravel-actions",
            text: "Laravel Actions",
          },
        ],
      },
      {
        text: "Testing",
        collapsible: true,
        items: [
          { link: "/testing/introduction", text: "Introduction" },
          {
            link: "/testing/testing-workflow-definitions",
            text: "Testing workflows",
          },
          {
            link: "/testing/faking-workflows",
            text: "Faking workflows",
          },
        ],
      },
      {
        text: "Configuration",
        collapsible: true,
        items: [
          {
            link: "/configuration/table-names",
            text: "Changing the table names",
          },
          {
            link: "/configuration/customizing-models",
            text: "Customizing models",
          },
          {
            link: "/configuration/customizing-model-states",
            text: "Customizing model states",
          },
        ],
      },
    ],
  },
};
