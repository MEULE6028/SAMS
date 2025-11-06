import { db } from "./server/db.js";
import { elections, candidates } from "./shared/schema.js";

async function check() {
  const e = await db.select().from(elections);
  console.log(`Found ${e.length} election(s)`);
  if (e.length > 0) {
    console.log('Election:', e[0].title, '- Status:', e[0].status);
  }
  
  const c = await db.select().from(candidates);
  console.log(`Found ${c.length} candidate(s)`);
  
  process.exit(0);
}

check().catch(console.error);
