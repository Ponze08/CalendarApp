import { PrismaClient } from "@prisma/client";
import { seedDefaultData } from "../lib/seed-service";

const prisma = new PrismaClient();

async function main() {
  await seedDefaultData(prisma);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
