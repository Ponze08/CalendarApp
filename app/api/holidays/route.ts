import { NextRequest } from "next/server";
import { createHolidayVacation, listHolidayVacations } from "@/lib/holiday-service";
import { jsonError, jsonOk } from "@/lib/http";

export async function GET(request: NextRequest) {
  try {
    const startParam = request.nextUrl.searchParams.get("start");
    const endParam = request.nextUrl.searchParams.get("end");
    const start = startParam ? new Date(startParam) : undefined;
    const end = endParam ? new Date(endParam) : undefined;
    const enabledOnly = request.nextUrl.searchParams.get("enabledOnly") === "true";
    const holidays = await listHolidayVacations(start, end, enabledOnly);
    return jsonOk({ holidays });
  } catch (error) {
    return jsonError(error, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const holiday = await createHolidayVacation(await request.json());
    return jsonOk({ holiday }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
