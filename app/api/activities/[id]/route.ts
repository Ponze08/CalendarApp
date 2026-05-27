import { NextRequest } from "next/server";
import { deleteActivity, getActivity, updateActivity } from "@/lib/activity-service";
import { jsonError, jsonOk } from "@/lib/http";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const activity = await getActivity(decodeURIComponent(id));
    if (!activity) return jsonError(new Error("Activity not found."), 404);
    return jsonOk({ activity });
  } catch (error) {
    return jsonError(error, 500);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const activity = await updateActivity(decodeURIComponent(id), await request.json());
    return jsonOk({ activity });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const result = await deleteActivity(decodeURIComponent(id), body);
    return jsonOk(result);
  } catch (error) {
    return jsonError(error);
  }
}
