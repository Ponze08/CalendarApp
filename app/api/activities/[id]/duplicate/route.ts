import { NextRequest } from "next/server";
import { duplicateActivity } from "@/lib/activity-service";
import { jsonError, jsonOk } from "@/lib/http";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const activity = await duplicateActivity(decodeURIComponent(id));
    return jsonOk({ activity }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
