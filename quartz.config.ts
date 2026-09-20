import { QuartzConfig } from "./quartz/cfg"
import * as Plugin from "./quartz/plugins"

/**
 * Quartz 4 Configuration
 *
 * See https://quartz.jzhao.xyz/configuration for more information.
 */
const config: QuartzConfig = {
  configuration: {
    pageTitle: "Pharmacology Masterrace",
    pageTitleSuffix: "",
    enableSPA: true,
    enablePopovers: true,
    analytics: null,
    locale: "pl-PL",
    baseUrl: "mikolajrura.github.io/pharmacology",
    // ^ przy deployu na GitHub Pages zmień na: mikolajrura.github.io
    ignorePatterns: ["private", "private/**", "**/templates", "**/templates/**", ".obsidian"],
    defaultDateType: "modified",
    theme: {
      fontOrigin: "googleFonts",
      cdnCaching: true,
      typography: {
        header: "Source Serif 4",
        body: "Source Serif 4",
        code: "IBM Plex Mono",
      },
      colors: {
        // matched to mikolajrura.github.io: paper #f7f7f7 / OLED #000,
        // hairline #dadada / #262626, muted #8a8a8a / #737373
        lightMode: {
          light: "#f7f7f7",
          lightgray: "#dadada",
          gray: "#8a8a8a",
          darkgray: "#3a3a3a",
          dark: "#171717",
          secondary: "#624f1c",
          tertiary: "#403312",
          highlight: "rgba(138, 138, 138, 0.12)",
          textHighlight: "#8a8a8a44",
        },
        darkMode: {
          light: "#000000",
          lightgray: "#262626",
          gray: "#737373",
          darkgray: "#c9c9c9",
          dark: "#ededed",
          secondary: "#e2d9b8",
          tertiary: "#f2eedf",
          highlight: "rgba(115, 115, 115, 0.12)",
          textHighlight: "#73737355",
        },
      },
    },
  },
  plugins: {
    transformers: [
      Plugin.FrontMatter(),
      Plugin.Molecules(),
      Plugin.Quiz(),
      Plugin.CreatedModifiedDate({
        priority: ["frontmatter", "git", "filesystem"],
      }),
      Plugin.SyntaxHighlighting({
        theme: {
          light: "github-light",
          dark: "github-dark",
        },
        keepBackground: false,
      }),
      Plugin.ObsidianFlavoredMarkdown({ enableInHtmlEmbed: false }),
      Plugin.GitHubFlavoredMarkdown(),
      Plugin.TableOfContents(),
      Plugin.CrawlLinks({ markdownLinkResolution: "shortest" }),
      Plugin.Description(),
      Plugin.Latex({ renderEngine: "katex" }),
    ],
    filters: [Plugin.RemoveDrafts()],
    emitters: [
      Plugin.AliasRedirects(),
      Plugin.ComponentResources(),
      Plugin.ContentPage(),
      Plugin.FolderPage(),
      Plugin.TagPage(),
      Plugin.ContentIndex({
        enableSiteMap: true,
        enableRSS: true,
      }),
      Plugin.Assets(),
      Plugin.Static(),
      Plugin.Favicon(),
      Plugin.NotFoundPage(),
      // Comment out CustomOgImages to speed up build time
      Plugin.CustomOgImages(),
    ],
  },
}

export default config
