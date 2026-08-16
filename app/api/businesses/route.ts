import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

function distanceInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function isOpenNow(openingHours: string | null): boolean {
  if (!openingHours) return false;

  try {
    const hours = JSON.parse(openingHours);
    const now = new Date();
    const day = now.getDay();
    const isWeekend = day === 0 || day === 6;

    if (isWeekend && hours.closedWeekends) return false;

    const [openH, openM] = (hours.openTime ?? "09:00").split(":").map(Number);
    const [closeH, closeM] = (hours.closeTime ?? "17:00").split(":").map(Number);

    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const openMinutes = openH * 60 + openM;
    const closeMinutes = closeH * 60 + closeM;

    return nowMinutes >= openMinutes && nowMinutes <= closeMinutes;
  } catch {
    return false;
  }
}

function logImpressions(businessIds: string[]) {
  if (businessIds.length === 0) return;
  prisma.searchImpression
    .createMany({
      data: businessIds.map((id) => ({ businessId: id })),
    })
    .catch((err) => console.error("Failed to log impressions:", err));
}

export async function GET(request: NextRequest) {
  const lat = request.nextUrl.searchParams.get("lat");
  const lng = request.nextUrl.searchParams.get("lng");
  const categoryId = request.nextUrl.searchParams.get("categoryId");
  const radiusKm = request.nextUrl.searchParams.get("radiusKm");
  const priceRange = request.nextUrl.searchParams.get("priceRange");
  const openNow = request.nextUrl.searchParams.get("openNow");

  let businesses = await prisma.business.findMany({
    where: {
      ...(categoryId ? { categoryId } : {}),
      ...(priceRange ? { priceRange } : {}),
    },
    include: { category: true },
  });

  if (openNow === "true") {
    businesses = businesses.filter((b) => isOpenNow(b.openingHours));
  }

  if (!lat || !lng) {
    const noLocationResults = businesses.slice(0, 20);
    logImpressions(noLocationResults.map((b) => b.id));
    return NextResponse.json(noLocationResults);
  }

  const userLat = parseFloat(lat);
  const userLng = parseFloat(lng);

  let withDistance = businesses.map((business) => ({
    ...business,
    distanceKm: distanceInKm(userLat, userLng, business.latitude, business.longitude),
  }));

  if (radiusKm) {
    const radius = parseFloat(radiusKm);
    withDistance = withDistance.filter((b) => b.distanceKm <= radius);
  }

  withDistance.sort((a, b) => a.distanceKm - b.distanceKm);

  const finalResults = withDistance.slice(0, 20);
  logImpressions(finalResults.map((b) => b.id));

  return NextResponse.json(finalResults);
}