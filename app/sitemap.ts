import type { MetadataRoute } from "next";
import { prisma } from "@/app/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const businesses = await prisma.business.findMany({
    select: { id: true, updatedAt: true },
  });

  const businessUrls = businesses.map((b) => ({
    url: `${baseUrl}/business/${b.id}`,
    lastModified: b.updatedAt,
  }));

  return [
    { url: baseUrl, lastModified: new Date() },
    ...businessUrls,
  ];
}
