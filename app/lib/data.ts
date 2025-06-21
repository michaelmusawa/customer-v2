// app/dashboard/[role]/report/dummy.ts
export type Summary = {
  totalValue: number;
  totalCount: number;
};

export type RankingRow = {
  id: number;
  name: string;
  totalValue: number;
  count: number;
  shift?: string;
};

export type ShiftSummary = {
  shift: string;
  totalValue: number;
};

// Dummy
export const dummySummary: Summary = {
  totalValue: 1234567,
  totalCount: 789,
};

export const dummyBillers: RankingRow[] = Array.from({ length: 5 }, (_, i) => ({
  id: i + 1,
  name: `Biller ${i + 1}`,
  totalValue: Math.floor(Math.random() * 500_000),
  count: Math.floor(Math.random() * 200),
  shift: ["Morning", "Afternoon", "Night"][i % 3],
}));

export const dummyServices: RankingRow[] = Array.from(
  { length: 5 },
  (_, i) => ({
    id: i + 1,
    name: `Service ${i + 1}`,
    totalValue: Math.floor(Math.random() * 800_000),
    count: Math.floor(Math.random() * 300),
    shift: ["Morning", "Afternoon", "Night"][i % 3],
  })
);

export const dummyShifts: ShiftSummary[] = [
  { shift: "Morning", totalValue: 400_000 },
  { shift: "Afternoon", totalValue: 500_000 },
  { shift: "Night", totalValue: 333_567 },
];
