"use client";

import { useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import type { CategoryDto } from "@/types/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CategoryManager({
  categories,
  onCategoriesChange
}: {
  categories: CategoryDto[];
  onCategoriesChange: (categories: CategoryDto[]) => void;
}) {
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#2563eb");
  const [drafts, setDrafts] = useState<Record<string, CategoryDto>>({});

  async function addCategory() {
    const response = await fetch("/api/categories", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: newName, color: newColor })
    });
    const json = (await response.json()) as { category?: CategoryDto; error?: string };
    if (json.category) {
      onCategoriesChange([...categories, json.category].sort((a, b) => a.name.localeCompare(b.name)));
      setNewName("");
    } else {
      window.alert(json.error ?? "Could not create category.");
    }
  }

  async function saveCategory(category: CategoryDto) {
    const draft = drafts[category.id] ?? category;
    const response = await fetch(`/api/categories/${category.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(draft)
    });
    const json = (await response.json()) as { category?: CategoryDto; error?: string };
    if (json.category) {
      onCategoriesChange(categories.map((item) => (item.id === category.id ? json.category! : item)));
      setDrafts(({ [category.id]: _removed, ...rest }) => rest);
    } else {
      window.alert(json.error ?? "Could not save category.");
    }
  }

  async function deleteCategory(id: string) {
    if (!window.confirm("Delete this category? Existing activities will keep running without a category.")) return;
    const response = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    if (response.ok) {
      onCategoriesChange(categories.filter((category) => category.id !== id));
    }
  }

  return (
    <section className="rounded-lg border bg-card p-5 shadow-sm">
      <h2 className="text-lg font-semibold">Categories</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_6rem_auto]">
        <div>
          <Label>New category</Label>
          <Input className="mt-2" value={newName} onChange={(event) => setNewName(event.target.value)} />
        </div>
        <div>
          <Label>Color</Label>
          <Input className="mt-2" type="color" value={newColor} onChange={(event) => setNewColor(event.target.value)} />
        </div>
        <Button className="self-end" type="button" onClick={addCategory} disabled={!newName.trim()}>
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </div>

      <div className="mt-5 space-y-2">
        {categories.map((category) => {
          const draft = drafts[category.id] ?? category;
          return (
            <div key={category.id} className="grid gap-2 rounded-md border bg-background p-3 sm:grid-cols-[1fr_6rem_auto_auto]">
              <Input
                value={draft.name}
                onChange={(event) =>
                  setDrafts({ ...drafts, [category.id]: { ...draft, name: event.target.value } })
                }
              />
              <Input
                type="color"
                value={draft.color}
                onChange={(event) =>
                  setDrafts({ ...drafts, [category.id]: { ...draft, color: event.target.value } })
                }
              />
              <Button type="button" variant="outline" size="sm" onClick={() => saveCategory(category)}>
                <Save className="h-4 w-4" />
                Save
              </Button>
              <Button type="button" variant="destructive" size="sm" onClick={() => deleteCategory(category.id)}>
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
