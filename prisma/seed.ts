import { prisma } from "@/lib/prisma";
import { generateSeedData } from "./seed-data";

async function main() {
  console.log("🌱 Starting seed process...");

  // Clear existing data
  console.log("🗑️  Clearing existing data...");
  await prisma.respondent.deleteMany();
  await prisma.session.deleteMany();
  console.log("✅ Existing data cleared");

  // Generate seed data
  console.log("📦 Generating seed data...");
  const seedData = generateSeedData(50);
  console.log(`✅ Generated ${seedData.length} records`);

  // Insert data
  console.log("💾 Inserting data into database...");
  let insertedCount = 0;

  for (const sessionData of seedData) {
    try {
      await prisma.session.create({
        data: {
          sessionCode: sessionData.sessionCode,
          audioFilename: sessionData.audioFilename,
          status: sessionData.status,
          createdAt: sessionData.createdAt,
          completedAt: sessionData.completedAt,
          respondent: {
            create: {
              name: sessionData.respondent.name,
              fatherName: sessionData.respondent.fatherName,
              motherName: sessionData.respondent.motherName,
              district: sessionData.respondent.district,
              upazila: sessionData.respondent.upazila,
              union: sessionData.respondent.union,
              village: sessionData.respondent.village,
              profession: sessionData.respondent.profession,
              incidentType: sessionData.respondent.incidentType,
              incidentYear: sessionData.respondent.incidentYear,
              incidentMonth: sessionData.respondent.incidentMonth,
              lossAmount: sessionData.respondent.lossAmount,
              additionalInfo: sessionData.respondent.additionalInfo,
            },
          },
        },
      });
      insertedCount++;
      if (insertedCount % 10 === 0) {
        console.log(
          `  ✅ Inserted ${insertedCount}/${seedData.length} records...`
        );
      }
    } catch (error) {
      console.error(
        `❌ Error inserting session ${sessionData.sessionCode}:`,
        error
      );
    }
  }

  console.log(
    `\n✅ Successfully inserted ${insertedCount} sessions with respondents`
  );
  console.log("🎉 Seed process completed!");
}

main()
  .catch((e) => {
    console.error("❌ Seed process failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
