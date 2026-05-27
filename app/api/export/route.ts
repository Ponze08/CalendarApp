import { NextRequest } from "next/server";
import { listActivities } from "@/lib/activity-service";
import { exportActivitiesToIcs, exportActivitiesToJson } from "@/lib/import-export";

export async function GET(request: NextRequest) {
  const start = new Date(request.nextUrl.searchParams.get("start") ?? "1970-01-01");
  const end = new Date(request.nextUrl.searchParams.get("end") ?? "2100-01-01");
  const format = request.nextUrl.searchParams.get("format") ?? "json";
  const activities = await listActivities({ start, end });

  if (format === "ics") {
    return new Response(exportActivitiesToIcs(activities), {
      headers: {
        "content-type": "text/calendar; charset=utf-8",
        "content-disposition": "attachment; filename=ticino-calendar.ics"
      }
    });
  }

  return new Response(exportActivitiesToJson(activities), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": "attachment; filename=ticino-calendar.json"
    }
  });
}
