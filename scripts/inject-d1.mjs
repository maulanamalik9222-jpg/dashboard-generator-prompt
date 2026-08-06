import fs from "node:fs";
const path="dist/server/wrangler.json";
const config=JSON.parse(fs.readFileSync(path,"utf8"));
config.d1_databases=[{binding:"DB",database_name:"promptgen-users",database_id:"777cc46b-ad99-46e5-a023-d5bd6663599e"}];
fs.writeFileSync(path,JSON.stringify(config));
console.log("D1 binding DB injected");
