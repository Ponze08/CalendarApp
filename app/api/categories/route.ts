import { NextRequest } from "next/server";
import { createCategory, listCategories } from "@/lib/category-service";
import { jsonError, jsonOk } from "@/lib/http";

export async function GET() {
  try {
    return jsonOk({ categories: await listCategories() });
  } catch (error) {
    return jsonError(error, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const category = await createCategory(await request.json());
    return jsonOk({ category }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
