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
    !fields.subservice ||
    !fields.recordType
  ) {
    throw new Error(
      "Missing required fields: " +
        (!fields.name ? "Customer Name, " : "") +
        (!fields.value ? "Total Amount" : "") +
        (!fields.recordNumber ? "Record Number, " : "") +
        (!fields.service ? "Service, " : "") +
        (!fields.subservice ? "Sub Service, " : "") +
        (!fields.recordType ? "Record Type, " : "")
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
  function extractRecordType(text: string): "invoice" | "receipt" | null {
    const normalized = text.toLowerCase();

    if (/\binvoice\s*no\b|\binvoice\b/.test(normalized)) {
      return "invoice";
    }

    if (/\breceipt\s*no\b|\breceipt\b/.test(normalized)) {
      return "receipt";
    }

    if (/\bbill\s*no\b|\bbill\b/.test(normalized)) {
      // normalize "bill" to "invoice"
      return "invoice";
    }

    return null;
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
  

  const normalized = cleanOcrText(rawText);
  const lower = normalized.toLowerCase();

  // --- 🔑 Record type detection ---
  const recordType = extractRecordType(rawText);

  
  // --- 1) Customer Name ---
 
const nameMatch =
  normalized.match(
    /RECEIVED\s+FROM\s*[:\-]?\s*([A-Z0-9'`’\-\. ]+)/i
  ) ||
  normalized.match(
    /CUSTOMERNAME\.?:\s*([A-Z0-9'`’\-\. ]+?)(?=\s+(?:APPLICATIONNO|INVOICENO|CUSTOMERNO|BILLTO|DATE|ITEM|DESCRIPTION|NARRATIVE|LANDPARCELNO|PAGE\d+|POWEREDBY)\b|$)/i
  ) ||
  normalized.match(
    /(?:\bCLIENT|\bNAME)\s*[:\-]\s*([A-Z0-9'`’\-\. ]+?)(?=\s+(?:INVOICE|BILL|APPLICATION|RECEIPT|LANDPARCELNO|PAYER|DETAILS)\b|$)/i
  );

let customerName = nameMatch?.[1]?.trim() ?? null;
if (customerName) customerName = deglueUppercaseName(customerName);



  // --- 2) Invoice/Receipt/Bill Number ---
  const numberMatch =
    normalized.match(
      /(?:INVOICENO|INVOICE\s*NO\.?|INVOICE\s*NUMBER|RECEIPT\s*NO\.?|RECEIPT\s*NUMBER)\s*[.:#-]?\s*([A-Z0-9\-]+)/i
    ) ||
    normalized.match(/(?:BILL\s*(?:NO|NUMBER))\s*[.:#-]?\s*([A-Z0-9\-]+)/i) ||
    // allow patterns like "Payment Receipt BL-LR-1ED5BA0F"
  normalized.match(/(?:PAYMENT\s+RECEIPT|RECEIPT)\s+([A-Z0-9\-]{6,})/i) ||
    // FIX: allow line breaks & extra spaces after "Received From"
    normalized.match(/RECEIVED\s+FROM[\s\n]+([A-Z0-9\-]+)/i);

  const recordNumber = numberMatch?.[1]?.trim() ?? null;


// --- 3) Total Amount ---
const amountMatch =
  normalized.match(
    /(?:GRAND\s*TOTAL(?:\s*KES)?|TOTAL(?:\s*AMOUNT)?(?:\s*KES)?|AMOUNT\s*DUE|BALANCE|BILL\s*TOTAL\s*AMOUNT|AMOUNT\s*RECEIVED|SERVICE\s*AMOUNT)\s*[.:]?\s*\$?([\d,]+\.\d{2})\b/i
  ) ||
  normalized.match(/GRANDTOTALKES\s+([\d,]+\.\d{2})/i) ||
  normalized.match(/([\d,]+\.\d{2})(?!.*[\d,]+\.\d{2})/);



  // --- 4) Date (unchanged) ---
   
  const fixedDate = new Date().toString();

  


  // --- 5) Service/Subservice inference (unchanged) ---
  let foundSub: string | null = null;
  let foundSvc: string | null = null;

  if (lower.includes("land rate for") || lower.includes("landratefor")) {
    foundSub = "Annual Land rates";
    const svc = services.find((s) =>
      s.subServices.some((ss) => ss.toLowerCase() === foundSub!.toLowerCase())
    );
    foundSvc = svc?.name ?? null;
  } else if (normalized.includes("UBP")) {
    const svc = services.find(
      (s) =>
        s.name.toLowerCase() === "unified business permits".toLowerCase()
    );
    foundSvc = svc?.name ?? "Unified Business Permits";
    foundSub = svc?.subServices?.[0] ?? "Unified Business Permits";
  }

// detect LR-based descriptions-UBP without service and sub service
if (/LR\s*[-]?|LRNo/i.test(normalized)) {
  foundSvc = "Land Rates";
  foundSub = "LR";
}

// --- Special case: Unified Business Permit (UBP) ---
if (/\bUBP\b|UNIFIED\s+BUSINESS\s+PERMIT/i.test(normalized)) {
  foundSvc = "Unified Business Permit";
  foundSub = "UBP";
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
    recordType,
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
