import { seedUsers } from "./user.seed";

export async function runSeeds() {
  console.log("🚀 Running seed scripts...");
  await seedUsers();
  console.log("🌱 Seeding completed!");
}
