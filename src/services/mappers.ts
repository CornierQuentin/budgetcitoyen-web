// Mapping générique snake_case -> camelCase pour les réponses API.
// Ne transforme QUE les clés des objets/tableaux, jamais les valeurs : une
// chaîne comme "IR" ou "AUTRES" (valeur d'un champ enum) reste inchangée.

function snakeToCamel(key: string): string {
  return key.replace(/_([a-z0-9])/g, (_match, char: string) => char.toUpperCase());
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function camelizeKeys<T>(input: unknown): T {
  if (Array.isArray(input)) {
    return input.map((item) => camelizeKeys(item)) as unknown as T;
  }

  if (isPlainObject(input)) {
    const result: Record<string, unknown> = {};
    Object.entries(input).forEach(([key, value]) => {
      result[snakeToCamel(key)] = camelizeKeys(value);
    });
    return result as T;
  }

  return input as T;
}
