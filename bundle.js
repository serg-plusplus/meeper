const esbuild = require("esbuild");
const postCssPlugin = require("esbuild-style-plugin");

const { NODE_ENV = "development" } = process.env;

const DEV = NODE_ENV === "development";
const PROD = NODE_ENV === "production";

const ENV_VARS_WHITELIST = [["NODE_ENV", NODE_ENV]];

const entryPoints = [
  "common.css",
  "background.ts",
  "content.ts",
  "welcome.ts",
  "meet.tsx",
  DEV && "hotreload.ts",
]
  .filter(Boolean)
  .map((p) => `src/${p}`);

(async () => {
  const ctx = await esbuild.context({
    entryPoints,
    outdir: "ext/assets",
    bundle: true,
    sourcemap: DEV,
    minify: PROD,
    define: Object.fromEntries(
      ENV_VARS_WHITELIST.map((item) => {
        const key = Array.isArray(item) ? item[0] : item;
        const value = Array.isArray(item) ? item[1] : process.env[key] ?? "";

        return [`process.env.${key}`, `"${value}"`];
      })
    ),
    plugins: [
      postCssPlugin({
        postcss: {
          plugins: [
            require("tailwindcss"),
            PROD && require("autoprefixer"),
          ].filter(Boolean),
        },
      }),
      {
        name: "success-logger",
        setup(build) {
          build.onEnd((result) => {
            if (result.errors.length === 0) {
              console.info("✅ Successfully bundled.");
            }
          });
        },
      },
    ],
  });

  if (DEV) {
    await ctx.watch();
  } else {
    await ctx.rebuild();
    ctx.dispose();
  }
})();
