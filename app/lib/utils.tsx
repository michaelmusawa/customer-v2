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

interface ValidationError extends Error {
  code: string;
  missing: string[];
}

export function validate(fields: ExtractedFields) {
  const missing: string[] = [];

  if (!fields.name) missing.push("Customer Name");
  if (!fields.value) missing.push("Total Amount");
  if (!fields.recordNumber) missing.push("Record Number");
  if (!fields.service) missing.push("Service");
  if (!fields.subservice) missing.push("Sub Service");
  if (!fields.recordType) missing.push("Record Type");

  if (missing.length > 0) {
    const message = `Missing required fields: ${missing.join(", ")}`;
    const err: ValidationError = new Error(message) as ValidationError;
    err.code = "VALIDATION_ERROR";
    err.missing = missing;
    throw err;
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
  /** ----------------------- 🧹 CLEANERS ----------------------- **/
  const cleanText = (text: string) =>
    text
      .replace(/[\r\n\f\v]+/g, " ")
      .replace(/\s+/g, " ")
      .replace(/Please include invoice number.*?(?=PAGE\d+|$)/gi, "")
      .replace(/POWEREDBY.*?(?=PAGE\d+|$)/gi, "")
      .replace(/Scan this QR Code.*?(?=PAGE\d+|$)/gi, "")
      .trim();

  const normalized = cleanText(rawText);
  const lower = normalized.toLowerCase();

  /** ----------------------- 🧭 RECORD TYPE ----------------------- **/
  const detectRecordType = (txt: string): "invoice" | "receipt" | null => {
    if (/\b(receiptno|receipt)\b/i.test(txt)) return "receipt";
    if (/\b(invoiceno|invoice|billto|bill)\b/i.test(txt)) return "invoice";
    return null;
  };
  const recordType = detectRecordType(normalized);

  /** ----------------------- 👤 CUSTOMER NAME ----------------------- **/
  const deglueName = (n?: string | null): string | null => {
    if (!n) return null;

    let name = n
      .replace(/\s{2,}/g, " ")
      .replace(
        /\b(PLOT|LAND|APPLICATION|INVOICE|RECEIPT|BILL|DATE|WARD|DESCRIPTION|ITEM|AMOUNT|NO)\b.*$/i,
        ""
      )
      .trim()
      .toUpperCase();

    // Fix letter-by-letter spacing (e.g., “N ANCY W AMBUI N GUGI” → “NANCY WAMBUI NGUGI”)
    name = name.replace(/\b([A-Z])\s+([A-Z])\b/g, "$1$2");

    // Fix broken multi-letter sequences (e.g., “M UTUAL” → “MUTUAL”)
    name = name.replace(/\b([A-Z])\s+([A-Z]{2,})\b/g, "$1$2");

    return name.trim();
  };

  const nameMatch =
    normalized.match(
      /\b(?:FOR|CUSTOMER\s*NAME|CUSTOMERNAME|NAME|PAYER\s*NAME|RECEIVED\s*FROM)\s*[.:]?\s*([A-Z][A-Z\s'&\-\.\d]{2,80}?)(?=\s*(?:PLOT|LAND|APPLICATION|INVOICE|RECEIPT|BILL|DATE|ID|WARD|DESCRIPTION|ITEM|AMOUNT|NO|$))/i
    ) ||
    normalized.match(
      /(?:CUSTOMERNAME\.?|PAYER\s*NAME|NAME|FOR)\s*[:\-]?\s*([A-Za-z0-9'`’\-\.\(\)\s]{3,80})(?=\s*(?:APPLICATION|INVOICE|RECEIPT|BILL|DATE|ID|LAND|WARD|DESCRIPTION|ITEM|AMOUNT|NO|$))/i
    ) ||
    normalized.match(
      /(?:APPLICATION\s*BY|CLIENT)\s*[:\-]?\s*([A-Za-z0-9'`’\-\.\(\)\s]{3,80})(?=\s*(?:INVOICE|RECEIPT|BILL|DATE|$))/i
    );

  const customerName = deglueName(
    nameMatch?.[1]?.replace(/\s{2,}/g, " ").trim() ?? null
  );

  /** ----------------------- 🔢 RECORD NUMBER ----------------------- **/
  const normalizedFixed = normalized
    .replace(/[\r\n\f\v]+/g, " ")
    .replace(/\u00A0/g, " ")
    .replace(/-\s+/g, "-");

  const recordNumberMatch =
    normalizedFixed.match(
      /\b(?:INVOICE|BILL|RECEIPT)\s*(?:NO|NUMBER|#)?[^A-Z0-9]{0,3}([A-Z]{1,4}[-_][A-Z]{1,4}[-_]?[A-Z0-9]{2,12})/i
    ) ||
    normalizedFixed.match(/\b(BL[-_]?[A-Z]{2,4}[-_]?[A-Z0-9]{2,12})\b/i) ||
    normalizedFixed.match(/\b([A-Z]{2,4}[-_][A-Z0-9]{3,12})\b/i) ||
    normalizedFixed.match(/\bBL[-_]LR[-_][A-Z0-9]{3,15}\b/i) ||
    normalizedFixed.match(
      /\b(?:RECEIPT\s*(?:NO|NUMBER|#)?[^A-Z0-9]{0,3})(\d{6,20})\b/i
    );

  const recordNumber =
    recordNumberMatch?.[1]?.replace(/\s+/g, "").trim() ?? null;

  /** ----------------------- 💰 AMOUNT ----------------------- **/
  const amountMatch =
    normalized.match(
      /(?:TOTAL\s*(?:AMOUNT|KES)?|GRAND\s*TOTAL|AMOUNT\s*(?:DUE|RECEIVED)|BILL\s*TOTAL\s*AMOUNT)\s*[:#]?\s*\$?\s*([\d,]+(?:\.\d{1,2})?)/i
    ) ||
    normalized.match(/KES\s*([\d,]+\.\d{1,2})/i) ||
    normalized.match(/([\d,]+\.\d{2})(?!.*[\d,]+\.\d{2})/);

  const value = amountMatch?.[1]?.replace(/[,]+/g, "").trim() ?? null;

  /** ----------------------- 🗓️ DATE DETECTION ----------------------- **/

  // Step 0: Pre-clean merged month+day+year (e.g., "MARCH682025" → "MARCH 6 2025")
  const cleanedText = normalized.replace(
    /\b(JANUARY|FEBRUARY|MARCH|APRIL|MAY|JUNE|JULY|AUGUST|SEPTEMBER|OCTOBER|NOVEMBER|DECEMBER|JAN|FEB|MAR|APR|JUN|JUL|AUG|SEP|OCT|NOV|DEC)(\d{1,2})(\d{2,4})\b/gi,
    (_, month, day, year) => `${month} ${day} ${year}`
  );

  // Step 1: Use cleanedText instead of normalized in your regex
  const dateCandidates = [
    ...cleanedText.matchAll(
      /\b(?:DATE|APPLICATION\s*DATE|INVOICE\s*DATE|DATE&TIME|BILLTO\s*DATE)\s*[:\-]?\s*([A-Z]{3,9}\s*\d{1,2},?\s*\d{2,4}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/gi
    ),
    ...cleanedText.matchAll(
      /\b(\d{1,2}[\/\-][A-Z]{3,9}[\/\-]?\d{2,4}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|[A-Z]{3,9}\s*\d{1,2},?\s*\d{2,4})\b/gi
    ),
  ].map((m) => m[1]);

  let parsedDate: Date | null = null;

  for (const d of dateCandidates) {
    const clean = d.replace(/\s+/g, " ").trim();
    const date = new Date(clean);
    if (!isNaN(date.getTime())) {
      parsedDate = date;
      break;
    }
  }

  const now = new Date();
  const maxDiff = 7 * 24 * 60 * 60 * 1000;
  const isDatePlausible =
    parsedDate && Math.abs(now.getTime() - parsedDate.getTime()) <= maxDiff;
  const finalDate = isDatePlausible ? parsedDate : now;

  /** ----------------------- 🧾 SERVICE & SUBSERVICE ----------------------- **/
  let foundService: string | null = null;
  let foundSubService: string | null = null;

  const detectByHeuristics = () => {
    if (/\bWAYLEAVES?\b/i.test(normalized)) {
      foundService = "Wayleave Services";
      foundSubService = "Annual Wayleave";
      return;
    }

    if (/\bLR\b|LAND\s*RATE/i.test(normalized)) {
      foundService = "Land Rates";
      foundSubService = "Annual Land Rates";
      return;
    }
    if (/\bUBP\b|UNIFIED\s+BUSINESS\s+PERMIT/i.test(normalized)) {
      foundService = "Unified Business Permit";
      foundSubService = "UBP";
      return;
    }
    if (/\bFOOD\s*HANDLING\b|PUBLIC\s*HEALTH/i.test(normalized)) {
      foundService = "Public Health Services";
      foundSubService = "FoodHandling";
      return;
    }

    // ✅ Add GHR detection
    if (/\bGHR\b|HOUSE\s*RENT/i.test(normalized)) {
      foundService = "Global";
      foundSubService = "House Rent";
      return;
    }
    if (/\bADF\b|ADVERTISEMENT/i.test(normalized)) {
      foundService = "Advertisement Management";
      foundSubService = "Outdoor Event";
      return;
    }
    if (/\bFH\b|FOOD\s*HANDLERS?\s*CERTIFICATE/i.test(normalized)) {
      foundService = "Health Certificates";
      foundSubService = "Food Handlers Certificate";
      return;
    }
  };

  outer: for (const svc of services) {
    for (const sub of svc.subServices) {
      if (lower.includes(sub.toLowerCase())) {
        foundService = svc.name;
        foundSubService = sub;
        break outer;
      }
    }
    if (lower.includes(svc.name.toLowerCase())) {
      foundService = svc.name;
      foundSubService = svc.subServices[0] ?? svc.name;
    }
  }

  if (!foundService || !foundSubService) detectByHeuristics();

  /** ----------------------- 🧩 BUILD RESULT ----------------------- **/
  const result: ExtractedFields = {
    ticket: "T-DAEMON",
    recordType,
    name: customerName ?? null,
    recordNumber,
    service: foundService,
    subservice: foundSubService,
    value,
    date: finalDate?.toISOString(),
  };

  console.log("Extracted fields:", result);
  return result;
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

export function aggregateExcelRows(rows: ExcelRow[]): ExtractedFields | null {
  let total = 0;
  let base: ExtractedFields | null = null;

  for (const r of rows) {
    const f = extractExcelFields(r);
    total += f.value || 0;
    if (!base) base = { ...f };
  }

  if (base) {
    base.value = total;

    console.log("Aggregated Excel fields:", base);
    return base;
  }

  return null;
}
