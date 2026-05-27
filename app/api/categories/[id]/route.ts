import { NextRequest } from "next/server";
import { deleteCategory, updateCategory } from "@/lib/category-service";
import { jsonError, jsonOk } from "@/lib/http";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const category = await updateCategory(decodeURIComponent(id), await request.json());
    return jsonOk({ category });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    return jsonOk(await deleteCategory(decodeURIComponent(id)));
  } catch (error) {
    return jsonError(error);
  }
}
