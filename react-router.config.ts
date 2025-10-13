import type { Config } from "@react-router/dev/config";

export default {
  ssr: true,
  serverBuildFile: "index.js",
  buildDirectory: "./build",
  serverModuleFormat: "esm",
} satisfies Config;
