import { NextRequest } from "next/server";
import { deleteHolidayVacation, updateHolidayVacation } from "@/lib/holiday-service";
import { jsonError, jsonOk } from "@/lib/http";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const holiday = await updateHolidayVacation(decodeURIComponent(id), await request.json());
    return jsonOk({ holiday });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    return jsonOk(await deleteHolidayVacation(decodeURIComponent(id)));
  } catch (error) {
    return jsonError(error);
  }
}
