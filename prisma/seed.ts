import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const categories = [
    { name: "Restaurants", slug: "restaurants" },
    { name: "Plumbers", slug: "plumbers" },
    { name: "Hotels", slug: "hotels" },
    { name: "Dentists", slug: "dentists" },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    });
  }

  const restaurantCategory = await prisma.category.findUnique({
    where: { slug: "restaurants" },
  });
  const plumberCategory = await prisma.category.findUnique({
    where: { slug: "plumbers" },
  });
  const hotelCategory = await prisma.category.findUnique({
    where: { slug: "hotels" },
  });

  await prisma.business.createMany({
    data: [
      {
        name: "The Golden Spoon",
        description: "Cozy family restaurant serving local and international dishes",
        addressLine: "Plot 123, Independence Ave",
        city: "Gaborone",
        region: "South-East District",
        country: "Botswana",
        latitude: -24.6282,
        longitude: 25.9231,
        categoryId: restaurantCategory!.id,
      },
      {
        name: "QuickFix Plumbing",
        description: "24/7 emergency plumbing services",
        addressLine: "45 Main Mall",
        city: "Gaborone",
        region: "South-East District",
        country: "Botswana",
        latitude: -24.6541,
        longitude: 25.9087,
        categoryId: plumberCategory!.id,
      },
      {
        name: "Grand Palm Hotel",
        description: "Comfortable stay near the city center",
        addressLine: "78 Molepolole Road",
        city: "Gaborone",
        region: "South-East District",
        country: "Botswana",
        latitude: -24.6112,
        longitude: 25.8975,
        categoryId: hotelCategory!.id,
      },
    ],
  });

  console.log("Seed data added successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });