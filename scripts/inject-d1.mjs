import fs from "node:fs";
const path = "dist/server/wrangler.json";
const config = JSON.parse(fs.readFileSync(path, "utf8"));
config.d1_databases = [
  {
    binding: "DB",
    database_name: "promptgen-users",
    database_id: "777cc46b-ad99-46e5-a023-d5bd6663599e",
  },
];
config.browser = { binding: "BROWSER" };
config.triggers = { crons: ["0 2 * * *", "0 14 * * *"] };
fs.writeFileSync(path, JSON.stringify(config));
console.log("D1 DB, Browser Run BROWSER, dan Cron 09:00/21:00 WIB injected");
