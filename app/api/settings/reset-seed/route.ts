import { db } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/http";
import { seedDefaultData } from "@/lib/seed-service";

export async function POST() {
  try {
    await seedDefaultData(db);
    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(error, 500);
  }
}
