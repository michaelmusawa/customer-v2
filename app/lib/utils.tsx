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
  // --- Helper: clean OCR noise/boilerplate ---
  function cleanOcrText(raw: string): string {
    return (
      raw
        .replace(/\s+/g, " ") // normalize whitespace
        // trim common boilerplate blocks that pollute matches
        .replace(/Please include invoice number.*?(?=PAGE\d+|$)/gi, "")
        .replace(/POWEREDBY.*?(?=PAGE\d+|$)/gi, "")
        .replace(/Scan this QR Code.*?(?=PAGE\d+|$)/gi, "")
        .trim()
    );
  }

  // --- Helper: insert spaces into glued ALL-CAPS org names ---
  function deglueUppercaseName(n: string): string {
    if (!n) return n;
    let name = n.toUpperCase().replace(/\s+/g, " ").trim();

    // Remove trailing stray labels if any slipped in
    name = name
      .replace(/\b(APPLICATIONNO|INVOICENO|CUSTOMERNO)\b.*$/i, "")
      .trim();

    // Insert spaces before common tokens if glued
    const tokens = [
      "KENYA",
      "UGANDA",
      "TANZANIA",
      "LIMITED",
      "LTD",
      "PLC",
      "INC",
      "LLC",
      "CO",
      "COMPANY",
      "HOLDINGS",
      "BANK",
      "INSURANCE",
      "UNIVERSITY",
      "COUNTY",
      "CITY",
    ];
    for (const t of tokens) {
      const re = new RegExp(`([A-Z])(${t})\\b`, "g"); // ...XKENYA -> X KENYA
      name = name.replace(re, "$1 $2");
    }

    // Clean leftover digits/punctuation inside the name
    name = name
      .replace(/[0-9.]+/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim();
    return name;
  }

  // --- Helper: pick the best (closest-to-today) OCR date candidate; ISO out ---
  function bestOcrDateFromText(
    text: string,
    referenceDate: Date = new Date()
  ): string | null {
    const months: Record<string, number> = {
      JANUARY: 1,
      FEBRUARY: 2,
      MARCH: 3,
      APRIL: 4,
      MAY: 5,
      JUNE: 6,
      JULY: 7,
      AUGUST: 8,
      SEPTEMBER: 9,
      OCTOBER: 10,
      NOVEMBER: 11,
      DECEMBER: 12,
    };

    const monthPattern =
      "(JANUARY|FEBRUARY|MARCH|APRIL|MAY|JUNE|JULY|AUGUST|SEPTEMBER|OCTOBER|NOVEMBER|DECEMBER)";

    // 1) Properly spaced: "JANUARY 02 2025"
    const spaced = new RegExp(
      `${monthPattern}\\s*([0-9Oolib]{1,2})\\s*([0-9Oolib]{4})`,
      "gi"
    );
    // 2) Fused: "JANUARY622025" (day + year stuck together)
    const fused = new RegExp(`${monthPattern}\\s*([0-9Oolib]{5,6})\\b`, "gi");

    const candidates: Date[] = [];

    function pushCandidate(monthStr: string, dayStr: string, yearStr: string) {
      // Fix OCR misreads
      const fix = (s: string) => s.replace(/[Oo]/g, "0").replace(/[ilI]/g, "1");
      // Special: day often has '6'/'8' for '0'
      const fixDay = (s: string) => fix(s).replace(/[68]/g, "0");

      const month = months[monthStr.toUpperCase()];
      let day = parseInt(fixDay(dayStr), 10);
      const year = parseInt(fix(yearStr), 10);

      if (!month || isNaN(day) || isNaN(year)) return;

      // Clamp to a real calendar day
      if (day < 1) day = 1;
      if (day > 31) day = 31;

      const d = new Date(year, month - 1, day);
      if (!isNaN(d.getTime())) candidates.push(d);
    }

    let m: RegExpExecArray | null;
    while ((m = spaced.exec(text)) !== null) {
      const [, monthStr, dayStr, yearStr] = m;
      pushCandidate(monthStr, dayStr, yearStr);
    }
    while ((m = fused.exec(text)) !== null) {
      const [, monthStr, fusedDigits] = m;
      // Split: last 4 = year, first 1–2 = day
      const yearStr = fusedDigits.slice(-4);
      const dayStr = fusedDigits.slice(0, fusedDigits.length - 4);
      pushCandidate(monthStr, dayStr, yearStr);
    }

    if (candidates.length === 0) return null;

    // Choose the date closest to referenceDate (no "snap" overrides)
    let best = candidates[0];
    let bestDiff = Math.abs(best.getTime() - referenceDate.getTime());
    for (const c of candidates) {
      const diff = Math.abs(c.getTime() - referenceDate.getTime());
      if (diff < bestDiff) {
        best = c;
        bestDiff = diff;
      }
    }
    return best.toISOString().split("T")[0];
  }

  const normalized = cleanOcrText(rawText);

  // --- 1) Customer Name (stop at next label via lookahead) ---
  const nameMatch =
    normalized.match(
      /CUSTOMERNAME\.?:\s*([A-Z0-9 ]+?)(?=\s+(?:APPLICATIONNO|INVOICENO|CUSTOMERNO|BILLTO|DATE|ITEM|DESCRIPTION|NARRATIVE|PAGE\d+|POWEREDBY)\b|$)/i
    ) ||
    normalized.match(
      /(?:\bCLIENT|\bNAME)\s*[:\-]\s*([A-Z0-9 ]+?)(?=\s+(?:INVOICE|BILL|APPLICATION)\b|$)/i
    );

  let customerName = nameMatch?.[1]?.trim() ?? null;
  if (customerName) customerName = deglueUppercaseName(customerName);

  // --- 2) Invoice/Bill Number (anchored; avoid "include invoice number on your cheque") ---
  const invoiceMatch =
    normalized.match(
      /(?:INVOICENO|INVOICE\s*NO\.?|INVOICE\s*NUMBER)\s*[.:#-]?\s*([A-Z0-9\-]+)/i
    ) ||
    normalized.match(/(?:BILL\s*(?:NO|NUMBER))\s*[.:#-]?\s*([A-Z0-9\-]+)/i);
  const recordNumber = invoiceMatch?.[1]?.trim() ?? null;

  // --- 3) Total Amount ---
  const amountMatch =
    normalized.match(
      /(?:GRAND\s*TOTAL(?:\s*KES)?|TOTAL\s*AMOUNT|AMOUNT\s*DUE|BALANCE|BILL\s*TOTAL\s*AMOUNT)\s*[.:]?\s*\$?([\d,]+\.\d{2})\b/i
    ) || normalized.match(/GRANDTOTALKES\s+([\d,]+\.\d{2})/i);

  // --- 4) Date (find best candidate across whole text) ---
  // Prefer explicit "BILLTO DATE ..." region if present, else global scan
  const billtoRegion =
    normalized.match(/BILLTO\s*DATE\s*([A-Z0-9 ]{5,20})/i)?.[0] ?? normalized;
  const fixedDate =
    bestOcrDateFromText(billtoRegion) || bestOcrDateFromText(normalized);

  // --- 5) Service/Subservice inference ---
  let foundSub: string | null = null;
  let foundSvc: string | null = null;
  const lower = normalized.toLowerCase();

  if (lower.includes("land rate for")) {
    foundSub = "Annual Land rates";
    const svc = services.find((s) =>
      s.subServices.some((ss) => ss.toLowerCase() === foundSub!.toLowerCase())
    );
    foundSvc = svc?.name ?? null;
  } else if (normalized.includes("UBP")) {
    const svc = services.find(
      (s) =>
        s.name.toLowerCase() === "single/unified business permits".toLowerCase()
    );
    foundSvc = svc?.name ?? "Single/Unified Business Permits";
    // pick a sensible default subservice if DB has one
    foundSub = svc?.subServices?.[0] ?? "Single Business Permits";
  }

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

  const result: ExtractedFields = {
    ticket: "T-DAEMON",
    recordType: "invoice",
    name: customerName ?? null,
    recordNumber: recordNumber ?? null,
    service: foundSvc ?? null,
    subservice: foundSub ?? null,
    value: amountMatch?.[1]?.trim() ?? null,
    date: fixedDate ?? null,
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
