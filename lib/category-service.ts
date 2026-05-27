import { db } from "@/lib/db";
import { toCategoryDto } from "@/lib/mappers";
import { categoryInputSchema, type CategoryInput } from "@/lib/validation";

export async function listCategories() {
  const categories = await db.category.findMany({ orderBy: { name: "asc" } });
  return categories.map(toCategoryDto);
}

export async function createCategory(input: CategoryInput) {
  const data = categoryInputSchema.parse(input);
  const category = await db.category.create({ data });
  return toCategoryDto(category);
}

export async function updateCategory(id: string, input: CategoryInput) {
  const data = categoryInputSchema.parse(input);
  const category = await db.category.update({ where: { id }, data });
  return toCategoryDto(category);
}

export async function deleteCategory(id: string) {
  await db.category.delete({ where: { id } });
  return { ok: true };
}
