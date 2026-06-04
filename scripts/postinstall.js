const { execSync } = require("child_process");
const { resolve } = require("path");

const cwd = resolve(__dirname, "..");
const npx = (cmd) => execSync("npx " + cmd, { stdio: "inherit", cwd });

npx("prisma generate --schema=prisma/schema.prisma");

if (process.env.VERCEL_ENV) {
  console.log("\nVercel (" + process.env.VERCEL_ENV + ") detected -- pushing schema...");
  npx("prisma db push --schema=prisma/schema.prisma --accept-data-loss");
}
