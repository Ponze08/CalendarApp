import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/http";
import { getSettings, updateSettings } from "@/lib/settings-service";

export async function GET() {
  try {
    return jsonOk({ settings: await getSettings() });
  } catch (error) {
    return jsonError(error, 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const settings = await updateSettings(await request.json());
    return jsonOk({ settings });
  } catch (error) {
    return jsonError(error);
  }
}
