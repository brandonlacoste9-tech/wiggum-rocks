import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const SECRET = process.env.LICENCE_SECRET;

if (!SECRET) {
  console.error("❌ Error: LICENCE_SECRET not found in .env");
  process.exit(1);
}

const args = process.argv.slice(2);
if (args.length < 2) {
  console.log("Usage: node generateLicense.js <tier> <client_name>");
  process.exit(1);
}

const [tier, clientName] = args;
const payload = {
  tier: tier.toLowerCase(),
  client: clientName,
  issuedAt: new Date().toISOString(),
  exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 365) // 1 year
};

const token = jwt.sign(payload, SECRET);
console.log("\n✅ LICENSE KEY:");
console.log(token);
console.log("\n");
