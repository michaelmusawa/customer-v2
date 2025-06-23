export const generatePagination = (currentPage: number, totalPages: number) => {
  // If the total number of pages is 7 or less,
  // display all pages without any ellipsis.
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  // If the current page is among the first 3 pages,
  // show the first 3, an ellipsis, and the last 2 pages.
  if (currentPage <= 3) {
    return [1, 2, 3, "...", totalPages - 1, totalPages];
  }

  // If the current page is among the last 3 pages,
  // show the first 2, an ellipsis, and the last 3 pages.
  if (currentPage >= totalPages - 2) {
    return [1, 2, "...", totalPages - 2, totalPages - 1, totalPages];
  }

  // If the current page is somewhere in the middle,
  // show the first page, an ellipsis, the current page and its neighbors,
  // another ellipsis, and the last page.
  return [
    1,
    "...",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "...",
    totalPages,
  ];
};

export const getSubordinateRole = (user: string): string => {
  switch (user) {
    case "admin":
      return "coordinator";
    case "coordinator":
      return "supervisor";
    case "supervisor":
      return "biller";
    default:
      return "unknown";
  }
};

export type NumericFieldType = "int" | "float2";

/**
 * Given an array of records and a map of which fields you want to total,
 * returns an object whose keys are the same fields, and whose values are
 * the summed (and correctly rounded) totals.
 *
 * @param data    an array of objects
 * @param fields  an object mapping each numeric field name to either:
 *                - `"int"`   → round to nearest integer
 *                - `"float2"` → round to 2 decimal places
 */
export function computeTotals<T extends Record<string, any>>(
  data: T[],
  fields: Record<keyof T, NumericFieldType>
): Record<keyof T, number> {
  const totals = {} as Record<keyof T, number>;

  for (const key of Object.keys(fields) as (keyof T)[]) {
    // sum every item[key] coerced to a float
    const rawSum = data.reduce<number>((sum, item) => {
      const n = parseFloat(String(item[key]) || "0");
      return sum + (isNaN(n) ? 0 : n);
    }, 0);

    // round according to your specification
    if (fields[key] === "int") {
      totals[key] = Math.round(rawSum);
    } else {
      totals[key] = parseFloat(rawSum.toFixed(2));
    }
  }

  return totals;
}
