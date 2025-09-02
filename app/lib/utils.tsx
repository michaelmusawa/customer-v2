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
export function computeTotals<T extends object, K extends keyof T>(
  data: T[],
  fields: Record<K, NumericFieldType>
): Record<K, number> {
  const totals = {} as Record<K, number>;

  for (const key of Object.keys(fields) as K[]) {
    // sum every item[key] coerced to a float
    const rawSum = data.reduce<number>((sum, item) => {
      const n = parseFloat(String(item[key]) || "0");
      return sum + (isNaN(n) ? 0 : n);
    }, 0);

    // round according to your specification
    totals[key] =
      fields[key] === "int"
        ? Math.round(rawSum)
        : parseFloat(rawSum.toFixed(2));
  }

  return totals;
}

// 1) Define the interface
interface DBError {
  code: string;
}

// 2) Narrow from unknown → DBError
export function isDBError(err: unknown): err is DBError {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    typeof (err as DBError).code === "string"
  );
}

export function validate(fields: ExtractedFields) {
  if (
    !fields.name ||
    !fields.value ||
    !fields.recordNumber ||
    !fields.service ||
    !fields.subservice
  ) {
    throw new Error(
      "Missing required fields: " +
        (!fields.name ? "Customer Name, " : "") +
        (!fields.value ? "Total Amount" : "") +
        (!fields.recordNumber ? "Record Number, " : "") +
        (!fields.service ? "Service" : "") +
        (!fields.subservice ? "Sub Service, " : "")
    );
  }
}

// app/lib/fieldExtractor.ts

export interface ExtractedFields {
  ticket: string | null;
  recordType: string | null;
  name?: string | null;
  recordNumber?: string | null;
  service: string | null;
  subservice: string | null;
  value: string | number | null;
  date?: string | null;
}

interface Service {
  id: number;
  name: string;
  subServices: string[];
}

export function extractFields(
  rawText: string,
  services: Service[]
): ExtractedFields {
  const normalized = rawText.replace(/\s+/g, " ").trim();

  // 1) Customer Name
  const customerMatch = normalized.match(
    /(?:client|name)[\s:]+(.+?)(?=\s+(?:invoice|bill|application)[\s:]|$)/i
  );

  // 2) Invoice/Bill Number
  const invoiceMatch = normalized.match(
    /(?:invoice|bill)[\s]*(?:no|number)[\s:]*([A-Za-z0-9_\-]+)/i
  );

  // 3) Total Amount
  const amountMatch = normalized.match(
    /(?:total|amount due|balance|grand total|bill total amount)[\s:]*\$?([\d,]+\.\d{2})\b/i
  );

  // 4) Date & Time
  const dateTimeMatch = normalized.match(
    /date[\s&]*time[\s:]*([\d\/]+\s+\d{1,2}:\d{2}\s*(?:AM|PM))/i
  );

  // 5) Subservice / Service
  let foundSub: string | null = null;
  let foundSvc: string | null = null;
  const lower = normalized.toLowerCase();

  // special case: "land rate for" → Annual Land rates
  if (lower.includes("land rate for")) {
    foundSub = "Annual Land rates";
    const svc = services.find((s) =>
      s.subServices.some((ss) => ss.toLowerCase() === foundSub!.toLowerCase())
    );
    foundSvc = svc?.name ?? null;
  }

  // special case: "UBP" → Service = "Single/Unified Business Permits"
  else if (normalized.includes("UBP")) {
    const svc = services.find(
      (s) =>
        s.name.toLowerCase() === "single/unified business permits".toLowerCase()
    );
    foundSvc = svc?.name ?? "Single/Unified Business Permits";
    // pick the only subservice from DB (if available)
    foundSub = svc?.subServices?.[0] ?? null;
  }

  // fallback: scan DB-provided services list
  if (!foundSub) {
    outer: for (const svc of services) {
      for (const sub of svc.subServices) {
        if (lower.includes(sub.toLowerCase())) {
          foundSub = sub;
          foundSvc = svc.name;
          break outer;
        }
      }
    }
  }

  return {
    ticket: "T-DAEMON",
    recordType: "invoice",
    name: customerMatch?.[1]?.trim() ?? null,
    recordNumber: invoiceMatch?.[1]?.trim() ?? null,
    service: foundSvc,
    subservice: foundSub,
    value: amountMatch?.[1]?.trim() ?? null,
    date: dateTimeMatch?.[1]?.trim() ?? null,
  };
}

// === helper: map a row to your invoice-fields shape ===
export interface ExcelRow {
  "Customer Name"?: string;
  "Invoice No"?: string;
  "Total Amount": string;
  "House/Stall No."?: string;
}

export function extractExcelFields(row: ExcelRow) {
  const name = row["Customer Name"]?.toString().trim();
  const recordNumber = row["Invoice No"]?.toString().trim();
  const value = parseFloat(row["Total Amount"]) || 0;
  const houseStall = row["House/Stall No."]?.toString().toLowerCase() || "";

  return {
    name,
    recordNumber,
    recordType: "invoice",
    ticket: "T-DAEMON",
    value,
    service: "County Rents",
    subservice: houseStall.includes("house")
      ? "County Houses"
      : "County Market Stalls",
  };
}
