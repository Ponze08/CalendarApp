import { NextRequest } from "next/server";
import { importHolidayVacations } from "@/lib/holiday-service";
import { jsonError, jsonOk } from "@/lib/http";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { holidays?: unknown[] };
    if (!Array.isArray(body.holidays)) {
      return jsonError(new Error("Holiday import must contain a holidays array."));
    }
    const result = await importHolidayVacations(body.holidays);
    return jsonOk(result);
  } catch (error) {
    return jsonError(error);
  }
}
