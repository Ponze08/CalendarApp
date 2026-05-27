import { NextRequest } from "next/server";
import { createActivity, listActivities } from "@/lib/activity-service";
import { jsonError, jsonOk } from "@/lib/http";

function listParam(request: NextRequest, key: string) {
  const value = request.nextUrl.searchParams.get(key);
  return value ? value.split(",").filter(Boolean) : undefined;
}

export async function GET(request: NextRequest) {
  try {
    const start = new Date(request.nextUrl.searchParams.get("start") ?? "");
    const end = new Date(request.nextUrl.searchParams.get("end") ?? "");
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return jsonError(new Error("Valid start and end query parameters are required."));
    }
    const activities = await listActivities({
      start,
      end,
      search: request.nextUrl.searchParams.get("search") ?? undefined,
      categoryIds: listParam(request, "categoryIds"),
      statuses: listParam(request, "statuses"),
      priorities: listParam(request, "priorities"),
      tags: listParam(request, "tags")
    });
    return jsonOk({ activities });
  } catch (error) {
    return jsonError(error, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const activity = await createActivity(await request.json());
    return jsonOk({ activity }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
