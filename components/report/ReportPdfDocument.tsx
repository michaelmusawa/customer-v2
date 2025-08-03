"use client";

import React from "react";
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  Font,
  Image,
} from "@react-pdf/renderer";
import type {
  ShiftSummaryItem,
  RankingDataItem,
  ShiftRankingSection,
  ServiceRankingItem,
  ShiftServiceSection,
} from "@/app/lib/reportActions";
import { DashboardSummary } from "@/app/lib/definitions";

// Register fonts
Font.register({
  family: "Inter",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfMZg.ttf",
    },
    {
      src: "https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYMZg.ttf",
      fontWeight: 500,
    },
    {
      src: "https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYMZg.ttf",
      fontWeight: 700,
    },
  ],
});

// Official Nairobi City County colors
const COLORS = {
  primary: "#00431F", // Nairobi green
  secondary: "#000000", // Black
  accent: "#8B4513", // Dark brown for accents
  border: "#CCCCCC", // Light gray for borders
  headerBg: "#F0F0F0", // Light gray for headers
};

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Inter",
    fontSize: 10,
    backgroundColor: "#FFFFFF",
  },
  header: {
    marginBottom: 20,
    textAlign: "center",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.primary,
    paddingBottom: 10,
    position: "relative",
  },
  countyName: {
    fontSize: 14,
    fontWeight: 700,
    color: COLORS.primary,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  website: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: 500,
  },
  departmentName: {
    fontSize: 12,
    fontWeight: 700,
    color: COLORS.primary,
    textTransform: "uppercase",
    marginTop: 10,
  },
  reportTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: COLORS.secondary,
    marginTop: 15,
    marginBottom: 8,
    textAlign: "center",
  },
  note: {
    fontSize: 9,
    color: COLORS.secondary,
    marginTop: 15,
    textAlign: "center",
  },
  filters: {
    fontSize: 9,
    color: COLORS.secondary,
    textAlign: "center",
    marginTop: 15,
    marginBottom: 15,
  },
  logo: {
    width: 105,
    height: 100,
    marginBottom: 10,
    alignSelf: "center",
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    backgroundColor: COLORS.headerBg,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 5,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: COLORS.primary,
  },
  table: {
    width: "100%",
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 5,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: COLORS.headerBg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerCell: {
    flex: 1,
    padding: 6,
    fontSize: 9,
    fontWeight: 700,
    color: COLORS.primary,
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  cell: {
    flex: 1,
    padding: 6,
    fontSize: 9,
    textAlign: "center",
    color: COLORS.secondary,
  },
  groupHeader: {
    backgroundColor: COLORS.headerBg,
    padding: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  groupTitle: {
    fontSize: 9,
    fontWeight: 700,
    color: COLORS.primary,
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 30,
    right: 30,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: COLORS.secondary,
    fontWeight: 500,
    borderTopWidth: 1,
    borderTopColor: COLORS.primary,
  },
  pageNumber: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 8,
    color: COLORS.secondary,
  },
  totalsRow: {
    flexDirection: "row",
    backgroundColor: COLORS.headerBg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    padding: 6,
  },
  totalsCell: {
    flex: 1,
    padding: 6,
    fontSize: 9,
    fontWeight: 700,
    textAlign: "center",
    color: COLORS.primary,
  },
  summaryContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
    paddingVertical: 8,
    borderTop: 1,
    borderBottom: 1,
    borderColor: COLORS.primary,
  },
  summaryItem: {
    flex: 1,
    textAlign: "center",
  },
  summaryLabel: {
    fontSize: 9,
    color: COLORS.primary,
    fontWeight: 500,
  },
  summaryValue: {
    fontSize: 11,
    fontWeight: 700,
    color: COLORS.secondary,
  },
  dateHeader: {
    position: "absolute",
    top: 10,
    right: 30,
    fontSize: 10,
    color: COLORS.secondary,
  },
  mosaicPlaceholder: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 212,
    height: 196,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  mosaicText: {
    fontSize: 8,
    color: "#666",
    textAlign: "center",
  },
});

const formatCurrency = (n: number) => `${n.toLocaleString("en-US")}`;
const safeNumber = (value: number | string): number => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/[^\d.]/g, "");
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }
  return 0;
};

const EMPTY_SUMMARY = {
  totalRecords: 0,
  totalValue: 0,
  totalServices: 0,
  totalClients: 0,
};

export interface ReportData {
  startDate?: string;
  endDate?: string;
  station?: string;
  rankBy?: string;
  groupByShift?: boolean;
  summary?: DashboardSummary;
  shiftSummary?: ShiftSummaryItem[];
  billerData?: RankingDataItem[] | ShiftRankingSection[];
  serviceData?: ServiceRankingItem[] | ShiftServiceSection[];
}

const isGrouped = (
  data:
    | RankingDataItem[]
    | ServiceRankingItem[]
    | ShiftRankingSection[]
    | ShiftServiceSection[]
): data is ShiftRankingSection[] | ShiftServiceSection[] => {
  return Array.isArray(data) && data.length > 0 && "shift" in data[0];
};

export default function ReportPdfDocument(raw: ReportData) {
  const {
    startDate = "",
    endDate = "",
    station = "",
    rankBy = "",
    groupByShift = false,
    summary = EMPTY_SUMMARY,
    shiftSummary = [],
    billerData = [],
    serviceData = [],
  } = raw;

  const safeSummary: DashboardSummary = { ...EMPTY_SUMMARY, ...summary };

  const renderTable = (
    headers: string[],
    data: RankingDataItem[] | ServiceRankingItem[] | ShiftServiceSection[],
    grouped: boolean,
    isService = false
  ) => {
    if (!Array.isArray(data) || data.length === 0) {
      return (
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            {headers.map((h, i) => (
              <Text key={i} style={styles.headerCell}>
                {h}
              </Text>
            ))}
          </View>
          <View style={styles.row}>
            <Text style={[styles.cell, { flex: headers.length }]}>
              No data available
            </Text>
          </View>
        </View>
      );
    }

    if (grouped) {
      return (
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            {headers.map((h, i) => (
              <Text key={i} style={styles.headerCell}>
                {h}
              </Text>
            ))}
          </View>
          {(data as (ShiftRankingSection | ShiftServiceSection)[]).map(
            (group, gi) => (
              <View key={gi}>
                <View style={styles.groupHeader}>
                  <Text style={styles.groupTitle}>Shift: {group.shift}</Text>
                </View>
                {group.items.map((item, ri) => (
                  <View style={styles.row} key={ri}>
                    <Text style={styles.cell}>{ri + 1}</Text>
                    <Text style={styles.cell}>
                      {isService
                        ? (item as ServiceRankingItem).service
                        : (item as RankingDataItem).key}
                    </Text>
                    <Text style={styles.cell}>{item.count}</Text>
                    <Text style={styles.cell}>{item.clients}</Text>
                    <Text style={styles.cell}>
                      {formatCurrency(safeNumber(item.value))}
                    </Text>
                  </View>
                ))}
                <View style={styles.totalsRow}>
                  <Text style={[styles.totalsCell, { flex: 2 }]}>TOTALS</Text>
                  <Text style={styles.totalsCell}>
                    {group.items.reduce(
                      (sum, i) => sum + safeNumber(i.count),
                      0
                    )}
                  </Text>
                  <Text style={styles.totalsCell}>
                    {group.items.reduce(
                      (sum, i) => sum + safeNumber(i.clients),
                      0
                    )}
                  </Text>
                  <Text style={styles.totalsCell}>
                    {formatCurrency(
                      group.items.reduce(
                        (sum, i) => sum + safeNumber(i.value),
                        0
                      )
                    )}
                  </Text>
                </View>
              </View>
            )
          )}
        </View>
      );
    }

    return (
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          {headers.map((h, i) => (
            <Text key={i} style={styles.headerCell}>
              {h}
            </Text>
          ))}
        </View>
        {(data as (RankingDataItem | ServiceRankingItem)[]).map((item, ri) => (
          <View style={styles.row} key={ri}>
            <Text style={styles.cell}>{ri + 1}</Text>
            <Text style={styles.cell}>
              {isService
                ? (item as ServiceRankingItem).service
                : (item as RankingDataItem).key}
            </Text>
            <Text style={styles.cell}>{item.count}</Text>
            <Text style={styles.cell}>{item.clients}</Text>
            <Text style={styles.cell}>
              {formatCurrency(safeNumber(item.value))}
            </Text>
          </View>
        ))}
        <View style={styles.totalsRow}>
          <Text style={[styles.totalsCell, { flex: 2 }]}>TOTALS</Text>
          <Text style={styles.totalsCell}>
            {data.reduce(
              (sum, i) => sum + safeNumber("count" in i ? i.count : 0),
              0
            )}
          </Text>
          <Text style={styles.totalsCell}>
            {data.reduce(
              (sum, i) => sum + safeNumber("clients" in i ? i.clients : 0),
              0
            )}
          </Text>
          <Text style={styles.totalsCell}>
            {formatCurrency(
              data.reduce(
                (sum, i) => sum + safeNumber("value" in i ? i.value : 0),
                0
              )
            )}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Mosaic Placeholder - Top Left */}
        <Image src="/images/mosaic.png" style={styles.mosaicPlaceholder} />

        {/* Date Header - Top Right */}
        <View style={styles.dateHeader}>
          <Text>Date: {new Date().toLocaleDateString()}</Text>
        </View>

        {/* Header Content */}
        <View style={styles.header}>
          {/* Main Logo - Centered */}
          <Image src="/images/county.png" style={styles.logo} />

          <Text style={styles.countyName}>NAIROBI CITY COUNTY</Text>
          <Text style={styles.website}>www.nairobi.go.ke</Text>
          <Text style={styles.departmentName}>
            DEPARTMENT OF CUSTOMER SERVICE
          </Text>

          <Text style={styles.reportTitle}>
            CUSTOMER SERVICE PERFORMANCE REPORT
          </Text>

          <Text style={styles.note}>
            Note: This report contains operational metrics for customer service
            activities
          </Text>
        </View>

        {/* Filters */}
        <View style={styles.filters}>
          <Text>
            {[
              `Period: ${startDate || "—"} to ${endDate || "—"}`,
              `Station: ${station || "All Stations"}`,
              `Ranked by: ${rankBy ? "Monetary Value" : "Transaction Count"}`,
              `Grouped by shift: ${groupByShift ? "Yes" : "No"}`,
            ].join(" • ")}
          </Text>
        </View>

        {/* Summary Section */}
        <View style={styles.summaryContainer}>
          {[
            ["Total Transactions", safeSummary.totalRecords],
            ["Total Value", formatCurrency(safeNumber(safeSummary.totalValue))],
            ["Services Used", safeSummary.totalServices],
            ["Clients Served", safeSummary.totalClients],
          ].map(([title, value], idx) => (
            <View key={idx} style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>{title}</Text>
              <Text style={styles.summaryValue}>{value}</Text>
            </View>
          ))}
        </View>

        {/* Biller Ranking */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>BILLER PERFORMANCE RANKING</Text>
          </View>
          {renderTable(
            ["Rank", "Biller", "Transactions", "Clients", "Value (KES)"],
            billerData as RankingDataItem[],
            isGrouped(billerData),
            false
          )}
        </View>

        {/* Service Ranking */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>SERVICE UTILIZATION RANKING</Text>
          </View>
          {renderTable(
            ["Rank", "Service", "Transactions", "Clients", "Value (KES)"],
            serviceData as ServiceRankingItem[],
            isGrouped(serviceData),
            true
          )}
        </View>

        {/* Shift Summary */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>SHIFT PERFORMANCE SUMMARY</Text>
          </View>
          {shiftSummary.length > 0 ? (
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                {["Shift", "Transactions", "Clients", "Value (KES)"].map(
                  (h, i) => (
                    <Text key={i} style={styles.headerCell}>
                      {h}
                    </Text>
                  )
                )}
              </View>
              {shiftSummary.map((sh, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.row,
                    idx === shiftSummary.length - 1
                      ? { borderBottomWidth: 0 }
                      : {},
                  ]}
                >
                  <Text style={styles.cell}>{sh.shift}</Text>
                  <Text style={styles.cell}>{sh.count}</Text>
                  <Text style={styles.cell}>{sh.clients}</Text>
                  <Text style={styles.cell}>
                    {formatCurrency(safeNumber(sh.value))}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text
              style={{
                textAlign: "center",
                color: COLORS.primary,
                padding: 10,
              }}
            >
              No shift summary data available
            </Text>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Generated: {new Date().toLocaleString()}</Text>
          <Text>Customer Service App</Text>
        </View>
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) =>
            `Page ${pageNumber} of ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
}

// "use client";

// import React from "react";
// import {
//   Document,
//   Page,
//   View,
//   Text,
//   StyleSheet,
//   Font,
//   Image,
//   Svg,
//   Line,
// } from "@react-pdf/renderer";
// import type {
//   ShiftSummaryItem,
//   RankingDataItem,
//   ShiftRankingSection,
//   ServiceRankingItem,
//   ShiftServiceSection,
// } from "@/app/lib/reportActions";
// import { DashboardSummary } from "@/app/lib/definitions";

// // Register fonts
// Font.register({
//   family: "Inter",
//   fonts: [
//     {
//       src: "https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfMZg.ttf",
//     },
//     {
//       src: "https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYMZg.ttf",
//       fontWeight: 500,
//     },
//     {
//       src: "https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYMZg.ttf",
//       fontWeight: 700,
//     },
//   ],
// });

// // Official Nairobi City County colors
// const COLORS = {
//   primary: "#00431F", // Nairobi green
//   secondary: "#000000", // Black
//   accent: "#8B4513", // Dark brown for accents
//   lightAccent: "#F0F7F3", // Light green background
//   darkAccent: "#002A10", // Dark green for headers
//   border: "#E0E0E0", // Light gray for borders
//   headerText: "#FFFFFF", // White for header text
// };

// const styles = StyleSheet.create({
//   page: {
//     padding: 30,
//     fontFamily: "Inter",
//     fontSize: 10,
//     backgroundColor: "#FFFFFF",
//     position: "relative",
//   },
//   watermark: {
//     position: "absolute",
//     top: "40%",
//     left: "15%",
//     fontSize: 120,
//     color: "rgba(0, 67, 31, 0.05)",
//     fontWeight: 700,
//     transform: "rotate(-45deg)",
//     textAlign: "center",
//     width: "70%",
//   },
//   header: {
//     marginBottom: 20,
//     borderBottomWidth: 2,
//     borderBottomColor: COLORS.primary,
//     paddingBottom: 15,
//     position: "relative",
//   },
//   headerRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginBottom: 10,
//   },
//   sealContainer: {
//     width: 80,
//     height: 80,
//     borderWidth: 2,
//     borderColor: COLORS.primary,
//     borderRadius: 40,
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "center",
//     marginRight: 15,
//   },
//   seal: {
//     width: 70,
//     height: 70,
//   },
//   headerText: {
//     flex: 1,
//   },
//   countyName: {
//     fontSize: 16,
//     fontWeight: 700,
//     color: COLORS.primary,
//     textTransform: "uppercase",
//     letterSpacing: 1.2,
//   },
//   departmentName: {
//     fontSize: 12,
//     fontWeight: 500,
//     color: COLORS.secondary,
//     textTransform: "uppercase",
//     marginTop: 4,
//   },
//   reportTitle: {
//     fontSize: 16,
//     fontWeight: 700,
//     color: COLORS.darkAccent,
//     marginTop: 15,
//     textAlign: "center",
//     textTransform: "uppercase",
//     letterSpacing: 0.8,
//   },
//   reportSubtitle: {
//     fontSize: 11,
//     color: COLORS.secondary,
//     textAlign: "center",
//     marginTop: 5,
//     fontWeight: 500,
//   },
//   filters: {
//     fontSize: 9,
//     color: COLORS.secondary,
//     textAlign: "center",
//     marginTop: 15,
//     marginBottom: 15,
//     padding: 8,
//     backgroundColor: COLORS.lightAccent,
//     borderRadius: 4,
//   },
//   dateHeader: {
//     position: "absolute",
//     top: 10,
//     right: 30,
//     fontSize: 9,
//     color: COLORS.secondary,
//     fontWeight: 500,
//   },
//   section: {
//     marginBottom: 25,
//   },
//   sectionHeader: {
//     backgroundColor: COLORS.darkAccent,
//     paddingVertical: 8,
//     paddingHorizontal: 12,
//     marginBottom: 8,
//     borderRadius: 3,
//   },
//   sectionTitle: {
//     fontSize: 12,
//     fontWeight: 700,
//     color: COLORS.headerText,
//     textTransform: "uppercase",
//   },
//   table: {
//     width: "100%",
//     borderWidth: 1,
//     borderColor: COLORS.border,
//     marginTop: 5,
//   },
//   tableHeader: {
//     flexDirection: "row",
//     backgroundColor: COLORS.primary,
//   },
//   headerCell: {
//     flex: 1,
//     padding: 8,
//     fontSize: 10,
//     fontWeight: 700,
//     color: COLORS.headerText,
//     textAlign: "center",
//   },
//   row: {
//     flexDirection: "row",
//     borderBottomWidth: 1,
//     borderBottomColor: COLORS.border,
//     backgroundColor: "#FFFFFF",
//   },
//   altRow: {
//     backgroundColor: COLORS.lightAccent,
//   },
//   cell: {
//     flex: 1,
//     padding: 8,
//     fontSize: 9,
//     textAlign: "center",
//     color: COLORS.secondary,
//   },
//   groupHeader: {
//     backgroundColor: "rgba(0, 67, 31, 0.15)",
//     padding: 8,
//     borderBottomWidth: 1,
//     borderBottomColor: COLORS.border,
//   },
//   groupTitle: {
//     fontSize: 10,
//     fontWeight: 700,
//     color: COLORS.primary,
//   },
//   footer: {
//     position: "absolute",
//     bottom: 20,
//     left: 30,
//     right: 30,
//     flexDirection: "row",
//     justifyContent: "space-between",
//     fontSize: 8,
//     color: COLORS.secondary,
//     fontWeight: 500,
//     borderTopWidth: 1,
//     borderTopColor: COLORS.primary,
//     paddingTop: 8,
//   },
//   pageNumber: {
//     textAlign: "center",
//     fontSize: 8,
//     color: COLORS.secondary,
//   },
//   totalsRow: {
//     flexDirection: "row",
//     backgroundColor: "rgba(0, 67, 31, 0.1)",
//     padding: 8,
//     borderTopWidth: 1,
//     borderTopColor: COLORS.border,
//   },
//   totalsCell: {
//     flex: 1,
//     padding: 8,
//     fontSize: 9,
//     fontWeight: 700,
//     textAlign: "center",
//     color: COLORS.primary,
//   },
//   summaryContainer: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     marginBottom: 20,
//     paddingVertical: 12,
//     borderTop: 2,
//     borderBottom: 2,
//     borderColor: COLORS.primary,
//     backgroundColor: COLORS.lightAccent,
//   },
//   summaryItem: {
//     flex: 1,
//     textAlign: "center",
//     paddingVertical: 5,
//   },
//   summaryLabel: {
//     fontSize: 9,
//     color: COLORS.primary,
//     fontWeight: 500,
//     textTransform: "uppercase",
//     letterSpacing: 0.5,
//   },
//   summaryValue: {
//     fontSize: 14,
//     fontWeight: 700,
//     color: COLORS.darkAccent,
//     marginTop: 3,
//   },
//   divider: {
//     borderRightWidth: 1,
//     borderRightColor: COLORS.primary,
//     height: "100%",
//   },
// });

// const formatCurrency = (n: number) => `KES ${n.toLocaleString("en-US")}`;
// const safeNumber = (value: number | string): number => {
//   if (typeof value === "number") return value;
//   if (typeof value === "string") {
//     const cleaned = value.replace(/[^\d.]/g, "");
//     const num = parseFloat(cleaned);
//     return isNaN(num) ? 0 : num;
//   }
//   return 0;
// };

// const EMPTY_SUMMARY = {
//   totalRecords: 0,
//   totalValue: 0,
//   totalServices: 0,
//   totalClients: 0,
// };

// export interface ReportData {
//   startDate?: string;
//   endDate?: string;
//   station?: string;
//   rankBy?: string;
//   groupByShift?: boolean;
//   summary?: DashboardSummary;
//   shiftSummary?: ShiftSummaryItem[];
//   billerData?: RankingDataItem[] | ShiftRankingSection[];
//   serviceData?: ServiceRankingItem[] | ShiftServiceSection[];
// }

// const isGrouped = (
//   data:
//     | RankingDataItem[]
//     | ServiceRankingItem[]
//     | ShiftRankingSection[]
//     | ShiftServiceSection[]
// ): data is ShiftRankingSection[] | ShiftServiceSection[] => {
//   return Array.isArray(data) && data.length > 0 && "shift" in data[0];
// };

// export default function ReportPdfDocument(raw: ReportData) {
//   const {
//     startDate = "",
//     endDate = "",
//     station = "",
//     rankBy = "",
//     groupByShift = false,
//     summary = EMPTY_SUMMARY,
//     shiftSummary = [],
//     billerData = [],
//     serviceData = [],
//   } = raw;

//   const safeSummary: DashboardSummary = { ...EMPTY_SUMMARY, ...summary };

//   const renderTable = (
//     headers: string[],
//     data: RankingDataItem[] | ServiceRankingItem[] | ShiftServiceSection[],
//     grouped: boolean,
//     isService = false
//   ) => {
//     if (!Array.isArray(data) || data.length === 0) {
//       return (
//         <View style={styles.table}>
//           <View style={styles.tableHeader}>
//             {headers.map((h, i) => (
//               <Text key={i} style={styles.headerCell}>
//                 {h}
//               </Text>
//             ))}
//           </View>
//           <View style={styles.row}>
//             <Text style={[styles.cell, { flex: headers.length }]}>
//               No data available
//             </Text>
//           </View>
//         </View>
//       );
//     }

//     if (grouped) {
//       return (
//         <View style={styles.table}>
//           <View style={styles.tableHeader}>
//             {headers.map((h, i) => (
//               <Text key={i} style={styles.headerCell}>
//                 {h}
//               </Text>
//             ))}
//           </View>
//           {(data as (ShiftRankingSection | ShiftServiceSection)[]).map(
//             (group, gi) => (
//               <View key={gi}>
//                 <View style={styles.groupHeader}>
//                   <Text style={styles.groupTitle}>SHIFT: {group.shift}</Text>
//                 </View>
//                 {group.items.map((item, ri) => (
//                   <View
//                     style={[styles.row, ri % 2 === 0 ? null : styles.altRow]}
//                     key={ri}
//                   >
//                     <Text style={styles.cell}>{ri + 1}</Text>
//                     <Text style={styles.cell}>
//                       {isService
//                         ? (item as ServiceRankingItem).service
//                         : (item as RankingDataItem).key}
//                     </Text>
//                     <Text style={styles.cell}>{item.count}</Text>
//                     <Text style={styles.cell}>{item.clients}</Text>
//                     <Text style={styles.cell}>
//                       {formatCurrency(safeNumber(item.value))}
//                     </Text>
//                   </View>
//                 ))}
//                 <View style={styles.totalsRow}>
//                   <Text style={[styles.totalsCell, { flex: 2 }]}>TOTALS</Text>
//                   <Text style={styles.totalsCell}>
//                     {group.items.reduce(
//                       (sum, i) => sum + safeNumber(i.count),
//                       0
//                     )}
//                   </Text>
//                   <Text style={styles.totalsCell}>
//                     {group.items.reduce(
//                       (sum, i) => sum + safeNumber(i.clients),
//                       0
//                     )}
//                   </Text>
//                   <Text style={styles.totalsCell}>
//                     {formatCurrency(
//                       group.items.reduce(
//                         (sum, i) => sum + safeNumber(i.value),
//                         0
//                       )
//                     )}
//                   </Text>
//                 </View>
//               </View>
//             )
//           )}
//         </View>
//       );
//     }

//     return (
//       <View style={styles.table}>
//         <View style={styles.tableHeader}>
//           {headers.map((h, i) => (
//             <Text key={i} style={styles.headerCell}>
//               {h}
//             </Text>
//           ))}
//         </View>
//         {(data as (RankingDataItem | ServiceRankingItem)[]).map((item, ri) => (
//           <View
//             style={[styles.row, ri % 2 === 0 ? null : styles.altRow]}
//             key={ri}
//           >
//             <Text style={styles.cell}>{ri + 1}</Text>
//             <Text style={styles.cell}>
//               {isService
//                 ? (item as ServiceRankingItem).service
//                 : (item as RankingDataItem).key}
//             </Text>
//             <Text style={styles.cell}>{item.count}</Text>
//             <Text style={styles.cell}>{item.clients}</Text>
//             <Text style={styles.cell}>
//               {formatCurrency(safeNumber(item.value))}
//             </Text>
//           </View>
//         ))}
//         <View style={styles.totalsRow}>
//           <Text style={[styles.totalsCell, { flex: 2 }]}>TOTALS</Text>
//           <Text style={styles.totalsCell}>
//             {data.reduce(
//               (sum, i) => sum + safeNumber("count" in i ? i.count : 0),
//               0
//             )}
//           </Text>
//           <Text style={styles.totalsCell}>
//             {data.reduce(
//               (sum, i) => sum + safeNumber("clients" in i ? i.clients : 0),
//               0
//             )}
//           </Text>
//           <Text style={styles.totalsCell}>
//             {formatCurrency(
//               data.reduce(
//                 (sum, i) => sum + safeNumber("value" in i ? i.value : 0),
//                 0
//               )
//             )}
//           </Text>
//         </View>
//       </View>
//     );
//   };

//   return (
//     <Document>
//       <Page size="A4" style={styles.page}>
//         {/* Watermark */}
//         <Text style={styles.watermark} fixed>
//           NAIROBI CITY COUNTY
//         </Text>

//         {/* Date Header */}
//         <View style={styles.dateHeader}>
//           <Text>Generated: {new Date().toLocaleDateString()}</Text>
//         </View>

//         {/* Header */}
//         <View style={styles.header}>
//           <View style={styles.headerRow}>
//             <View style={styles.sealContainer}>
//               <Image src="/images/county-seal.png" style={styles.seal} />
//             </View>
//             <View style={styles.headerText}>
//               <Text style={styles.countyName}>NAIROBI CITY COUNTY</Text>
//               <Text style={styles.departmentName}>
//                 DEPARTMENT OF CUSTOMER SERVICE
//               </Text>
//             </View>
//           </View>

//           <View style={{ alignItems: "center" }}>
//             <Text style={styles.reportTitle}>SERVICE PERFORMANCE REPORT</Text>
//             <Text style={styles.reportSubtitle}>
//               Operational Metrics and Performance Indicators
//             </Text>
//           </View>
//         </View>

//         {/* Filters */}
//         <View style={styles.filters}>
//           <Text>
//             {[
//               `PERIOD: ${startDate || "—"} TO ${endDate || "—"}`,
//               `STATION: ${station || "All Stations"}`,
//               `RANKING BASIS: ${
//                 rankBy ? "MONETARY VALUE" : "TRANSACTION VOLUME"
//               }`,
//               `SHIFT GROUPING: ${groupByShift ? "ENABLED" : "DISABLED"}`,
//             ].join(" | ")}
//           </Text>
//         </View>

//         {/* Summary Section */}
//         <View style={styles.summaryContainer}>
//           {[
//             ["Total Transactions", safeSummary.totalRecords],
//             ["Total Value", formatCurrency(safeNumber(safeSummary.totalValue))],
//             ["Services Used", safeSummary.totalServices],
//             ["Clients Served", safeSummary.totalClients],
//           ].map(([title, value], idx) => (
//             <React.Fragment key={idx}>
//               <View style={styles.summaryItem}>
//                 <Text style={styles.summaryLabel}>{title}</Text>
//                 <Text style={styles.summaryValue}>{value}</Text>
//               </View>
//               {idx < 3 && <View style={styles.divider} />}
//             </React.Fragment>
//           ))}
//         </View>

//         {/* Biller Ranking */}
//         <View style={styles.section}>
//           <View style={styles.sectionHeader}>
//             <Text style={styles.sectionTitle}>BILLER PERFORMANCE RANKING</Text>
//           </View>
//           {renderTable(
//             ["Rank", "Biller", "Transactions", "Clients", "Value (KES)"],
//             billerData as RankingDataItem[],
//             isGrouped(billerData),
//             false
//           )}
//         </View>

//         {/* Service Ranking */}
//         <View style={styles.section}>
//           <View style={styles.sectionHeader}>
//             <Text style={styles.sectionTitle}>SERVICE UTILIZATION RANKING</Text>
//           </View>
//           {renderTable(
//             ["Rank", "Service", "Transactions", "Clients", "Value (KES)"],
//             serviceData as ServiceRankingItem[],
//             isGrouped(serviceData),
//             true
//           )}
//         </View>

//         {/* Shift Summary */}
//         <View style={styles.section}>
//           <View style={styles.sectionHeader}>
//             <Text style={styles.sectionTitle}>SHIFT PERFORMANCE SUMMARY</Text>
//           </View>
//           {shiftSummary.length > 0 ? (
//             <View style={styles.table}>
//               <View style={styles.tableHeader}>
//                 {["Shift", "Transactions", "Clients", "Value (KES)"].map(
//                   (h, i) => (
//                     <Text key={i} style={styles.headerCell}>
//                       {h}
//                     </Text>
//                   )
//                 )}
//               </View>
//               {shiftSummary.map((sh, idx) => (
//                 <View
//                   key={idx}
//                   style={[
//                     styles.row,
//                     idx % 2 === 0 ? null : styles.altRow,
//                     idx === shiftSummary.length - 1
//                       ? { borderBottomWidth: 0 }
//                       : {},
//                   ]}
//                 >
//                   <Text style={styles.cell}>{sh.shift}</Text>
//                   <Text style={styles.cell}>{sh.count}</Text>
//                   <Text style={styles.cell}>{sh.clients}</Text>
//                   <Text style={styles.cell}>
//                     {formatCurrency(safeNumber(sh.value))}
//                   </Text>
//                 </View>
//               ))}
//             </View>
//           ) : (
//             <View style={[styles.table, { padding: 15 }]}>
//               <Text
//                 style={{
//                   textAlign: "center",
//                   color: COLORS.primary,
//                   fontWeight: 500,
//                 }}
//               >
//                 No shift summary data available
//               </Text>
//             </View>
//           )}
//         </View>

//         {/* Footer */}
//         <View style={styles.footer}>
//           <Text>OFFICIAL USE ONLY</Text>
//           <Text>Customer Service Management System</Text>
//           <Text
//             render={({ pageNumber, totalPages }) =>
//               `Page ${pageNumber} of ${totalPages}`
//             }
//           />
//         </View>
//       </Page>
//     </Document>
//   );
// }
