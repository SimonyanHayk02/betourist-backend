import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';

const prisma = new PrismaClient();

async function upsertCountry({ name, isoCode2, isoCode3 }) {
  return prisma.country.upsert({
    where: { isoCode2 },
    update: {
      name,
      isoCode3: isoCode3 ?? null,
      deletedAt: null,
    },
    create: {
      name,
      isoCode2,
      isoCode3: isoCode3 ?? null,
    },
  });
}

async function ensureCity({
  name,
  countryId,
  wktLocation,
  heroImageUrl,
}) {
  const existing = await prisma.city.findFirst({
    where: { name, countryId, deletedAt: null },
    select: { id: true },
  });

  if (!existing) {
    const id = randomUUID();
    if (wktLocation) {
      await prisma.$executeRaw`
        INSERT INTO "cities" ("id","createdAt","updatedAt","deletedAt","name","countryId","location","heroImageUrl")
        VALUES (${id}::uuid, now(), now(), NULL, ${name}, ${countryId}::uuid, ST_GeogFromText(${wktLocation}), ${heroImageUrl ?? null})
      `;
    } else {
      await prisma.$executeRaw`
        INSERT INTO "cities" ("id","createdAt","updatedAt","deletedAt","name","countryId","location","heroImageUrl")
        VALUES (${id}::uuid, now(), now(), NULL, ${name}, ${countryId}::uuid, NULL, ${heroImageUrl ?? null})
      `;
    }
    return { id, created: true };
  }

  // Update optional fields if provided.
  if (wktLocation) {
    await prisma.$executeRaw`
      UPDATE "cities"
      SET "updatedAt"=now(),
          "location"=ST_GeogFromText(${wktLocation}),
          "heroImageUrl"=${heroImageUrl ?? null}
      WHERE "id"=${existing.id}::uuid
    `;
  } else if (heroImageUrl !== undefined) {
    await prisma.city.update({
      where: { id: existing.id },
      data: { heroImageUrl: heroImageUrl ?? null },
    });
  }

  return { id: existing.id, created: false };
}

async function upsertCategory({ name, slug }) {
  return prisma.category.upsert({
    where: { slug },
    update: { name, deletedAt: null },
    create: { name, slug },
  });
}

async function main() {
  console.log('Seeding BeTourist...');

  const armenia = await upsertCountry({
    name: 'Armenia',
    isoCode2: 'AM',
    isoCode3: 'ARM',
  });

  const yerevan = await ensureCity({
    name: 'Yerevan',
    countryId: armenia.id,
    wktLocation: 'POINT(44.5126 40.1772)',
    // Optional: set a real Cloudinary URL later
    heroImageUrl: null,
  });

  await upsertCategory({ name: 'Cafe', slug: 'cafe' });
  await upsertCategory({ name: 'Museums', slug: 'museums' });

  console.log('Seed done.');
  console.log({
    country: { id: armenia.id, isoCode2: armenia.isoCode2 },
    city: { id: yerevan.id, created: yerevan.created },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


