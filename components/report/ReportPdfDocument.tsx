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

// Nairobi City County color palette
const COLORS = {
  primary: "#006400", // Dark green
  secondary: "#FFD700", // Gold/yellow
  accent: "#8B4513", // Saddle brown for accents
  lightGreen: "#E8F5E9", // Light green for backgrounds
  lightText: "#ffffff", // White text
  darkText: "#333333", // Dark text
  border: "#C8E6C9", // Light green border
  cardBg: "#ffffff", // White card background
  headerBg: "#004d00", // Darker green for headers
};

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Inter",
    fontSize: 10,
    backgroundColor: COLORS.lightGreen,
  },
  container: {
    marginBottom: 20,
  },
  header: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    textAlign: "center",
    boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
  },
  titleContainer: {
    marginBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.secondary,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    color: COLORS.lightText,
    textAlign: "center",
    marginBottom: 5,
    textTransform: "uppercase",
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.secondary,
    textAlign: "center",
    marginBottom: 8,
    fontWeight: 500,
  },
  motto: {
    fontSize: 10,
    color: COLORS.lightText,
    textAlign: "center",
    marginTop: 5,
  },
  filters: {
    fontSize: 10,
    color: COLORS.lightText,
    textAlign: "center",
    marginTop: 10,
    backgroundColor: "rgba(0, 80, 0, 0.7)",
    padding: 5,
    borderRadius: 4,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 10,
    alignSelf: "center",
  },
  cardContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 25,
    gap: 12,
  },
  card: {
    flex: 1,
    backgroundColor: COLORS.cardBg,
    borderRadius: 8,
    padding: 15,
    borderTopWidth: 4,
    borderTopColor: COLORS.secondary,
    boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
  },
  cardTitle: {
    fontSize: 10,
    color: COLORS.primary,
    marginBottom: 8,
    fontWeight: 500,
  },
  cardValue: {
    fontSize: 18,
    fontWeight: 700,
    color: COLORS.primary,
    textAlign: "center",
    paddingVertical: 5,
  },
  section: {
    marginBottom: 25,
    backgroundColor: COLORS.cardBg,
    borderRadius: 8,
    overflow: "hidden",
    boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
  },
  sectionHeader: {
    backgroundColor: COLORS.headerBg,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: COLORS.secondary,
    textTransform: "uppercase",
  },
  table: {
    width: "100%",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: COLORS.primary,
  },
  headerCell: {
    flex: 1,
    padding: 8,
    fontSize: 10,
    fontWeight: 700,
    color: COLORS.lightText,
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: "#ffffff",
    ":nth-child-even": { backgroundColor: "#f8f9fa" },
  },
  cell: {
    flex: 1,
    padding: 8,
    fontSize: 9,
    textAlign: "center",
    color: COLORS.darkText,
  },
  groupHeader: {
    backgroundColor: "#FFF9C4",
    padding: 8,
    marginTop: 10,
    marginBottom: 5,
    borderRadius: 4,
  },
  groupTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: COLORS.primary,
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: COLORS.primary,
    fontWeight: 500,
  },
  pageNumber: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 8,
    color: COLORS.primary,
  },
  totalsRow: {
    flexDirection: "row",
    backgroundColor: "#FFFDE7",
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    padding: 8,
  },
  totalsCell: {
    flex: 1,
    padding: 8,
    fontSize: 9,
    fontWeight: 700,
    textAlign: "center",
    color: COLORS.primary,
  },
  countyBadge: {
    position: "absolute",
    top: 20,
    right: 20,
    backgroundColor: COLORS.secondary,
    color: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 8,
    fontWeight: 700,
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
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* County Badge */}
        <View style={styles.countyBadge}>
          <Text>CUSTOMER SERVICE APP</Text>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Image src="/images/county.png" style={styles.logo} />
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Nairobi City County</Text>
            <Text style={styles.subtitle}>Department of Customer Service</Text>
          </View>
          <Text style={styles.motto}>
            INCLUSIVITY, PUBLIC PARTICIPATION, & CUSTOMER SERVICES
          </Text>
          <Text style={styles.filters}>
            {[
              `Period: ${startDate || "—"} to ${endDate || "—"}`,
              `Station: ${station || "All"}`,
              `Ranked by: ${rankBy ? "Value" : "Count"}`,
              `Group by shift: ${groupByShift ? "Yes" : "No"}`,
            ].join(" • ")}
          </Text>
        </View>

        {/* Summary Cards */}
        <View style={styles.cardContainer}>
          {[
            ["Total Records", safeSummary.totalRecords],
            ["Total Value", formatCurrency(safeNumber(safeSummary.totalValue))],
            ["Services Used", safeSummary.totalServices],
            ["Clients Served", safeSummary.totalClients],
          ].map(([title, value], idx) => (
            <View key={idx} style={styles.card}>
              <Text style={styles.cardTitle}>{title}</Text>
              <Text style={styles.cardValue}>{value}</Text>
            </View>
          ))}
        </View>

        {/* Biller Ranking */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>BILLER PERFORMANCE RANKING</Text>
          </View>
          {renderTable(
            ["Rank", "Biller", "Count", "Clients", "Value (KES)"],
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
            ["Rank", "Service", "Count", "Clients", "Value (KES)"],
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
                {["Shift", "Transactions", "Clients", "Value"].map((h, i) => (
                  <Text key={i} style={styles.headerCell}>
                    {h}
                  </Text>
                ))}
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

        {/* Footer & Page Numbers */}
        <View style={styles.footer}>
          <Text>Let&apos;s make Nairobi work</Text>
          <Text>{new Date().toLocaleString()}</Text>
        </View>
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) =>
            `${pageNumber} / ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
}
