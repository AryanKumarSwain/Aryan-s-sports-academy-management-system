import { PrismaClient } from '../src/generated/prisma/index.js';

const prisma = new PrismaClient();

const GLOBAL_SPORTS = [
  'Cricket',
  'Football',
  'Basketball',
  'Tennis',
  'Badminton',
  'Swimming',
  'Athletics',
  'Hockey'
];

const main = async () => {
  for (const name of GLOBAL_SPORTS) {
    const existing = await prisma.sport.findFirst({
      where: { name, academy_id: null }
    });

    if (!existing) {
      await prisma.sport.create({
        data: {
          name,
          academy_id: null,
          is_custom: false
        }
      });
    }
  }

  console.log('Global sports catalog seeded.');
};

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
