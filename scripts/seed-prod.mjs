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
    update: { name, deletedAt: null, isActive: true },
    create: { name, slug, isActive: true },
  });
}

async function ensurePlace({
  name,
  description,
  cityId,
  categoryId,
  isFeatured,
  priceFromCents,
  currency,
  ratingAvg,
  ratingCount,
  wktLocation,
  mediaUrls,
}) {
  const existing = await prisma.place.findFirst({
    where: { name, cityId, deletedAt: null },
    select: { id: true },
  });

  const data = {
    name,
    description: description ?? null,
    isPublished: true,
    isFeatured: Boolean(isFeatured),
    priceFromCents: priceFromCents ?? null,
    currency: currency ?? null,
    ratingAvg: ratingAvg ?? 0,
    ratingCount: ratingCount ?? 0,
    cityId,
    categoryId: categoryId ?? null,
  };

  let placeId;
  if (!existing) {
    placeId = randomUUID();
    // Insert via SQL so we can set PostGIS geography point.
    if (wktLocation) {
      await prisma.$executeRaw`
        INSERT INTO "places" (
          "id","createdAt","updatedAt","deletedAt",
          "name","description","isPublished","isFeatured",
          "priceFromCents","currency","ratingAvg","ratingCount",
          "cityId","categoryId","location"
        )
        VALUES (
          ${placeId}::uuid, now(), now(), NULL,
          ${data.name}, ${data.description}, ${data.isPublished}, ${data.isFeatured},
          ${data.priceFromCents}, ${data.currency}, ${data.ratingAvg}, ${data.ratingCount},
          ${data.cityId}::uuid, ${data.categoryId}::uuid,
          ST_GeogFromText(${wktLocation})
        )
      `;
    } else {
      await prisma.$executeRaw`
        INSERT INTO "places" (
          "id","createdAt","updatedAt","deletedAt",
          "name","description","isPublished","isFeatured",
          "priceFromCents","currency","ratingAvg","ratingCount",
          "cityId","categoryId","location"
        )
        VALUES (
          ${placeId}::uuid, now(), now(), NULL,
          ${data.name}, ${data.description}, ${data.isPublished}, ${data.isFeatured},
          ${data.priceFromCents}, ${data.currency}, ${data.ratingAvg}, ${data.ratingCount},
          ${data.cityId}::uuid, ${data.categoryId}::uuid,
          NULL
        )
      `;
    }
  } else {
    placeId = existing.id;
    await prisma.place.update({
      where: { id: placeId },
      data,
    });
    if (wktLocation) {
      await prisma.$executeRaw`
        UPDATE "places"
        SET "updatedAt"=now(),
            "location"=ST_GeogFromText(${wktLocation})
        WHERE "id"=${placeId}::uuid
      `;
    }
  }

  // Ensure media items exist (idempotent).
  for (let i = 0; i < (mediaUrls?.length ?? 0); i += 1) {
    const url = mediaUrls[i];
    const exists = await prisma.placeMedia.findFirst({
      where: { placeId, url, deletedAt: null },
      select: { id: true },
    });
    if (!exists) {
      await prisma.placeMedia.create({
        data: {
          placeId,
          url,
          sortOrder: i,
        },
      });
    }
  }

  return { id: placeId, created: !existing };
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

  const dilijan = await ensureCity({
    name: 'Dilijan',
    countryId: armenia.id,
    wktLocation: 'POINT(44.8636 40.7417)',
    heroImageUrl: null,
  });

  const gyumri = await ensureCity({
    name: 'Gyumri',
    countryId: armenia.id,
    wktLocation: 'POINT(43.8453 40.7894)',
    heroImageUrl: null,
  });

  const categories = {
    glamping: await upsertCategory({ name: 'Glamping', slug: 'glamping' }),
    tour: await upsertCategory({ name: 'Tour', slug: 'tour' }),
    excursion: await upsertCategory({ name: 'Excursion', slug: 'excursion' }),
    food: await upsertCategory({ name: 'Food', slug: 'food' }),
    hiking: await upsertCategory({ name: 'Hiking', slug: 'hiking' }),
  };

  // Experiences (Places): 10 simple realistic records, some featured.
  const experiences = [
    {
      name: 'Yerevan Food Walk',
      description: 'A guided walk through local markets and bakeries.',
      cityId: yerevan.id,
      categoryId: categories.food.id,
      isFeatured: true,
      priceFromCents: 2500,
      currency: 'USD',
      ratingAvg: 4.7,
      ratingCount: 128,
      wktLocation: 'POINT(44.5130 40.1777)',
      mediaUrls: [
        'https://picsum.photos/seed/yerevan-food-1/1200/800',
        'https://picsum.photos/seed/yerevan-food-2/1200/800',
      ],
    },
    {
      name: 'Dilijan Forest Hike',
      description: 'Easy hike in the Dilijan National Park.',
      cityId: dilijan.id,
      categoryId: categories.hiking.id,
      isFeatured: true,
      priceFromCents: 3000,
      currency: 'USD',
      ratingAvg: 4.9,
      ratingCount: 84,
      wktLocation: 'POINT(44.8660 40.7440)',
      mediaUrls: [
        'https://picsum.photos/seed/dilijan-hike-1/1200/800',
        'https://picsum.photos/seed/dilijan-hike-2/1200/800',
        'https://picsum.photos/seed/dilijan-hike-3/1200/800',
      ],
    },
    {
      name: 'Gyumri Architecture Walk',
      description: 'Discover old streets and local culture in Gyumri.',
      cityId: gyumri.id,
      categoryId: categories.tour.id,
      isFeatured: false,
      priceFromCents: 2000,
      currency: 'USD',
      ratingAvg: 4.6,
      ratingCount: 52,
      wktLocation: 'POINT(43.8460 40.7890)',
      mediaUrls: ['https://picsum.photos/seed/gyumri-walk-1/1200/800'],
    },
    {
      name: 'Wine Tasting Near Yerevan',
      description: 'Evening wine tasting with local snacks.',
      cityId: yerevan.id,
      categoryId: categories.excursion.id,
      isFeatured: true,
      priceFromCents: 3500,
      currency: 'USD',
      ratingAvg: 4.8,
      ratingCount: 210,
      wktLocation: 'POINT(44.5000 40.1700)',
      mediaUrls: ['https://picsum.photos/seed/yerevan-wine-1/1200/800'],
    },
    {
      name: 'Lake Sevan Day Trip (from Yerevan)',
      description: 'Full-day trip to Lake Sevan and nearby viewpoints.',
      cityId: yerevan.id,
      categoryId: categories.excursion.id,
      isFeatured: true,
      priceFromCents: 4500,
      currency: 'USD',
      ratingAvg: 4.5,
      ratingCount: 96,
      wktLocation: 'POINT(44.8900 40.3600)',
      mediaUrls: ['https://picsum.photos/seed/sevan-1/1200/800'],
    },
    {
      name: 'Cozy Glamping Weekend (Dilijan)',
      description: 'Two nights in nature with breakfast included.',
      cityId: dilijan.id,
      categoryId: categories.glamping.id,
      isFeatured: true,
      priceFromCents: 12000,
      currency: 'USD',
      ratingAvg: 4.9,
      ratingCount: 41,
      wktLocation: 'POINT(44.8700 40.7350)',
      mediaUrls: ['https://picsum.photos/seed/dilijan-glamping-1/1200/800'],
    },
    {
      name: 'Photography Spots Tour (Yerevan)',
      description: 'Golden hour photography route across the city.',
      cityId: yerevan.id,
      categoryId: categories.tour.id,
      isFeatured: false,
      priceFromCents: 1800,
      currency: 'USD',
      ratingAvg: 4.4,
      ratingCount: 33,
      wktLocation: 'POINT(44.5150 40.1750)',
      mediaUrls: ['https://picsum.photos/seed/yerevan-photo-1/1200/800'],
    },
    {
      name: 'Family Picnic Experience (Dilijan)',
      description: 'A relaxed picnic setup in a scenic forest spot.',
      cityId: dilijan.id,
      categoryId: categories.food.id,
      isFeatured: false,
      priceFromCents: 2800,
      currency: 'USD',
      ratingAvg: 4.3,
      ratingCount: 18,
      wktLocation: 'POINT(44.8600 40.7400)',
      mediaUrls: ['https://picsum.photos/seed/dilijan-picnic-1/1200/800'],
    },
    {
      name: 'Local Crafts Mini Tour (Gyumri)',
      description: 'Meet local artisans and explore small workshops.',
      cityId: gyumri.id,
      categoryId: categories.tour.id,
      isFeatured: true,
      priceFromCents: 2200,
      currency: 'USD',
      ratingAvg: 4.7,
      ratingCount: 64,
      wktLocation: 'POINT(43.8440 40.7900)',
      mediaUrls: ['https://picsum.photos/seed/gyumri-crafts-1/1200/800'],
    },
    {
      name: 'Sunrise Hike (Gyumri outskirts)',
      description: 'Short sunrise hike with a panoramic view.',
      cityId: gyumri.id,
      categoryId: categories.hiking.id,
      isFeatured: false,
      priceFromCents: 1500,
      currency: 'USD',
      ratingAvg: 4.2,
      ratingCount: 12,
      wktLocation: 'POINT(43.8200 40.8000)',
      mediaUrls: ['https://picsum.photos/seed/gyumri-hike-1/1200/800'],
    },
  ];

  for (const e of experiences) {
    await ensurePlace(e);
  }

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


