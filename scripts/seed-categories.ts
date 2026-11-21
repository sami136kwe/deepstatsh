import { createServiceClient, seedCategories } from "./lib";

async function main() {
  const db = createServiceClient();
  const result = await seedCategories(db);
  console.log(`Categories upserted: ${result.categories}, discovery queries: ${result.queries}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
