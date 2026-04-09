export const CATALOG_PROJECT_TYPES = ["Cocina", "Closet", "TV Unit"] as const;

export function isCocinasProjectTypeForConIsla(projectType: string): boolean {
  return projectType.toLowerCase().includes("cocina");
}

export function normalizeLegacyProjectTypeToCatalog(projectType: string): string {
  if (!projectType?.trim()) return CATALOG_PROJECT_TYPES[0];
  const normalized = projectType.trim().toLowerCase();
  if (normalized.includes("closet")) return "Closet";
  if (normalized.includes("tv")) return "TV Unit";
  return "Cocina";
}