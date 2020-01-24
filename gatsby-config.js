const path = require("path");
module.exports = {
  pathPrefix: "/",
  siteMetadata: require("./site-metadata.json"),
  plugins: [
    {
      resolve: `gatsby-plugin-sitemap`,
      options: {
        exclude: [`/admin`]
      }
    },
    {
      resolve: "gatsby-plugin-robots-txt",
      options: {
        policy: [{ userAgent: "*", allow: "/" }]
      }
    },
    `gatsby-plugin-react-helmet`,
    `gatsby-source-data`,
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `pages`,
        path: `${__dirname}/src/pages`
      }
    },
    {
      resolve: `gatsby-plugin-stackbit-static-sass`,
      options: {
        inputFile: `${__dirname}/src/sass/main.scss`,
        outputFile: `${__dirname}/public/assets/css/main.css`
      }
    },
    {
      resolve: `gatsby-transformer-remark`,
      options: {
        plugins: [
          `gatsby-remark-component`,
          {
            // https://www.gatsbyjs.org/packages/gatsby-remark-vscode/
            resolve: `gatsby-remark-vscode`,
            // All options are optional. Defaults shown here.
            options: {
              colorTheme: {
                defaultTheme: "Light+ (default light)",
                prefersDarkTheme: "Dark+ (default dark)", // Optional: used with `prefers-color-scheme: dark`
                // prefersLightTheme: "Light+ (default light)" // Optional: used with `prefers-color-scheme: light`
              },
              wrapperClassName: "", // Additional class put on 'pre' tag. Also accepts function to set the class dynamically.
              injectStyles: true, // Injects (minimal) additional CSS for layout and scrolling
              extensions: [], // Extensions to download from the marketplace to provide more languages and themes
              // Absolute path to the directory where extensions will be downloaded. Defaults to inside node_modules.
              extensionDataDirectory: path.resolve("extensions"),
              languageAliases: {}, // Map of custom/unknown language codes to standard/known language codes
              replaceColor: x => x, // Function allowing replacement of a theme color with another. Useful for replacing hex colors with CSS variables.
              getLineClassName: ({
                // Function allowing dynamic setting of additional class names on individual lines
                content, //   - the string content of the line
                index, //   - the zero-based index of the line within the code fence
                language, //   - the language specified for the code fence
                codeFenceOptions //   - any options set on the code fence alongside the language (more on this later)
              }) => "",
              logLevel: "error" // Set to 'warn' to debug if something looks wrong
            }
          }
        ]
      }
    },
    {
      resolve: `gatsby-remark-page-creator`,
      options: {}
    },
    {
      resolve: `@stackbit/gatsby-plugin-menus`,
      options: {
        sourceUrlPath: `fields.url`,
        pageContextProperty: `menus`,
        menus: require("./src/data/menus.json")
      }
    }
  ]
};
