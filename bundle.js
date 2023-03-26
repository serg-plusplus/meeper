const esbuild = require("esbuild");

const { NODE_ENV = "development" } = process.env;

const DEV = NODE_ENV === "development";
const PROD = NODE_ENV === "production";

const entryPoints = ["src/background.ts", "src/content.ts"];

(async () => {
  const ctx = await esbuild.context({
    entryPoints,
    outdir: "ext/scripts",
    bundle: true,
    sourcemap: DEV,
    minify: PROD,
    plugins: [
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
