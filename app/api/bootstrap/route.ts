import { listCategories } from "@/lib/category-service";
import { jsonError, jsonOk } from "@/lib/http";
import { getSettings } from "@/lib/settings-service";

export async function GET() {
  try {
    const [categories, settings] = await Promise.all([listCategories(), getSettings()]);
    return jsonOk({ categories, settings });
  } catch (error) {
    return jsonError(error, 500);
  }
}
