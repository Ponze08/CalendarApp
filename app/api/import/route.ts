import { NextRequest } from "next/server";
import { createActivity } from "@/lib/activity-service";
import { jsonError, jsonOk } from "@/lib/http";
import { parseJsonImport, parseSimpleIcs } from "@/lib/import-export";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const format = String(formData.get("format") ?? "json");
    if (!(file instanceof File)) {
      return jsonError(new Error("Upload a JSON or ICS file."));
    }
    const text = await file.text();
    const rawActivities = format === "ics" ? parseSimpleIcs(text) : parseJsonImport(text);
    const created = [];
    for (const raw of rawActivities) {
      created.push(await createActivity(raw));
    }
    return jsonOk({ imported: created.length, activities: created });
  } catch (error) {
    return jsonError(error);
  }
}
