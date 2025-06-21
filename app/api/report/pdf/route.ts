// app/api/report/pdf/route.ts
export const runtime = "nodejs";

import { NextResponse, NextRequest } from "next/server";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { access, readFile } from "fs/promises";
import path from "path";
import {
  fetchSummaryStats,
  fetchShiftSummaryData,
  fetchRankingData,
  fetchServiceRankingData,
} from "@/app/lib/reportActions";

// Color palette
const COLORS = {
  primary: [0, 91, 150], // Dark blue
  secondary: [232, 90, 79], // Coral
  accent: [255, 166, 0], // Amber
  success: [46, 204, 113], // Green
  background: [245, 247, 250], // Light gray
  darkText: [30, 30, 30], // Dark text
  lightText: [255, 255, 255], // White text
};

// Helper to format currency
const formatCurrency = (value: number) => {
  return `KES ${value.toLocaleString("en-US")}`;
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get("startDate") || "";
  const endDate = searchParams.get("endDate") || "";
  const station = searchParams.get("station") || "";
  const rankBy = searchParams.get("rankBy") === "value";
  const groupByShift = searchParams.get("groupByShift") === "true";

  try {
    // Fetch data
    const [summary, shiftSummary, billerData, serviceData] = await Promise.all([
      fetchSummaryStats(startDate, endDate, station),
      fetchShiftSummaryData(startDate, endDate, station),
      fetchRankingData(startDate, endDate, station, rankBy, groupByShift),
      fetchServiceRankingData(
        startDate,
        endDate,
        station,
        rankBy,
        groupByShift
      ),
    ]);

    // Initialize PDF in landscape
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "pt",
      format: "a4",
    });

    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();
    const M = 40; // Margin
    const headerHeight = 100;

    // Background
    doc.setFillColor(
      COLORS.background[0],
      COLORS.background[1],
      COLORS.background[2]
    );
    doc.rect(0, 0, W, H, "F");

    // Header with primary color
    doc.setFillColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
    doc.rect(0, 0, W, headerHeight, "F");

    // Logo
    try {
      const imgPath = path.join(process.cwd(), "public/images/county.png");
      await access(imgPath);
      const buf = await readFile(imgPath);
      const b64 = Buffer.from(buf).toString("base64");
      doc.addImage(`data:image/png;base64,${b64}`, "PNG", M, 20, 60, 60);
    } catch (e) {
      console.log("Logo not found, proceeding without it");
    }

    // Title
    doc.setFontSize(20).setFont("helvetica", "bold");
    doc.setTextColor(
      COLORS.lightText[0],
      COLORS.lightText[1],
      COLORS.lightText[2]
    );
    const title = "SERVICE AGENT PERFORMANCE REPORT";
    doc.text(title, W / 2, 60, { align: "center" });

    // Subtitle and date
    doc.setFontSize(12).setFont("helvetica", "normal");
    const subtitle = `Report Period: ${startDate} to ${endDate}`;
    doc.text(subtitle, W / 2, 80, { align: "center" });

    // Filters
    doc.setFontSize(10);
    const filters = [
      `Station: ${station || "All"}`,
      `Ranked by: ${rankBy ? "Value" : "Count"}`,
      `Group by shift: ${groupByShift ? "Yes" : "No"}`,
    ].join("   •   ");

    doc.setTextColor(200, 200, 200);
    doc.text(filters, W / 2, 95, { align: "center" });

    // Reset text color for content
    doc.setTextColor(
      COLORS.darkText[0],
      COLORS.darkText[1],
      COLORS.darkText[2]
    );

    let y = headerHeight + 30;

    // Summary cards
    const cards = [
      { title: "Total Records", value: summary.totalRecords },
      {
        title: "Total Value",
        value: formatCurrency(summary.totalValue),
      },
      { title: "Services Used", value: summary.totalServices },
      { title: "Clients Served", value: summary.totalClients },
    ];

    const cardWidth = (W - M * 2 - 30) / 4;
    cards.forEach((card, i) => {
      const x = M + i * (cardWidth + 10);

      // Card background
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(220, 220, 220);
      doc.roundedRect(x, y, cardWidth, 80, 5, 5, "FD");

      // Icon
      doc.setFontSize(24);

      // Text
      doc.setFontSize(10).setFont("helvetica", "normal");
      doc.text(card.title, x + 50, y + 20);
      doc.setFontSize(12).setFont("helvetica", "bold");
      doc.text(card.value.toString(), x + 50, y + 45);
    });

    y += 100;

    // Section header helper
    const sectionHeader = (title: string, color: number[]) => {
      doc.setFillColor(color[0], color[1], color[2]);
      doc.rect(M, y, W - M * 2, 25, "F");
      doc.setFontSize(12).setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.text(title, M + 10, y + 17);
      y += 35;
    };

    // Biller Ranking
    sectionHeader("BILLER RANKING", COLORS.primary);

    const processRankingData = (
      data: any,
      isGrouped: boolean,
      isService = false
    ) => {
      const tables = [];

      if (isGrouped) {
        for (const section of data) {
          const sectionTitle = `Shift: ${section.shift}`;
          tables.push({
            title: sectionTitle,
            head: [
              [
                "Rank",
                isService ? "Service" : "Biller",
                "Count",
                "Clients",
                "Value",
              ],
            ],
            body: section.items.map((item: any, idx: number) => [
              idx + 1,
              isService ? item.service : item.key,
              item.count,
              item.clients,
              formatCurrency(item.value),
            ]),
            foot: [
              [
                {
                  content: "TOTALS",
                  colSpan: 2,
                  styles: { fontStyle: "bold" },
                },
                section.items.reduce((sum: number, i: any) => sum + i.count, 0),
                section.items.reduce(
                  (sum: number, i: any) => sum + i.clients,
                  0
                ),
                formatCurrency(
                  section.items.reduce(
                    (sum: number, i: any) => sum + i.value,
                    0
                  )
                ),
              ],
            ],
          });
        }
      } else {
        tables.push({
          title: "Overall Ranking",
          head: [
            [
              "Rank",
              isService ? "Service" : "Biller",
              "Count",
              "Clients",
              "Value",
            ],
          ],
          body: data.map((item: any, idx: number) => [
            idx + 1,
            isService ? item.service : item.key,
            item.count,
            item.clients,
            formatCurrency(item.value),
          ]),
          foot: [
            [
              { content: "TOTALS", colSpan: 2, styles: { fontStyle: "bold" } },
              data.reduce((sum: number, i: any) => sum + i.count, 0),
              data.reduce((sum: number, i: any) => sum + i.clients, 0),
              formatCurrency(
                data.reduce((sum: number, i: any) => sum + i.value, 0)
              ),
            ],
          ],
        });
      }

      return tables;
    };

    // Add biller tables
    const billerTables = processRankingData(billerData, groupByShift);
    for (const table of billerTables) {
      autoTable(doc, {
        startY: y,
        head: table.head,
        body: table.body,
        foot: table.foot,
        theme: "grid",
        styles: {
          fontSize: 9,
          cellPadding: 4,
          halign: "center",
        },
        headStyles: {
          fillColor: COLORS.primary,
          textColor: COLORS.lightText,
          fontStyle: "bold",
        },
        footStyles: {
          fillColor: COLORS.background,
          textColor: COLORS.darkText,
          fontStyle: "bold",
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        didDrawPage: () => {
          // Add section title
          doc.setFontSize(10).setFont("helvetica", "bold");
          doc.setTextColor(
            COLORS.primary[0],
            COLORS.primary[1],
            COLORS.primary[2]
          );
          doc.text(table.title, M, y - 10);
        },
      });

      y = (doc as any).lastAutoTable.finalY + 20;
    }

    // Service Ranking
    sectionHeader("SERVICE RANKING", COLORS.secondary);

    // Add service tables
    const serviceTables = processRankingData(serviceData, groupByShift, true);
    for (const table of serviceTables) {
      autoTable(doc, {
        startY: y,
        head: table.head,
        body: table.body,
        foot: table.foot,
        theme: "grid",
        styles: {
          fontSize: 9,
          cellPadding: 4,
          halign: "center",
        },
        headStyles: {
          fillColor: COLORS.secondary,
          textColor: COLORS.lightText,
          fontStyle: "bold",
        },
        footStyles: {
          fillColor: COLORS.background,
          textColor: COLORS.darkText,
          fontStyle: "bold",
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        didDrawPage: () => {
          // Add section title
          doc.setFontSize(10).setFont("helvetica", "bold");
          doc.setTextColor(
            COLORS.secondary[0],
            COLORS.secondary[1],
            COLORS.secondary[2]
          );
          doc.text(table.title, M, y - 10);
        },
      });

      y = (doc as any).lastAutoTable.finalY + 20;
    }

    // Shift Summary
    sectionHeader("SHIFT SUMMARY", COLORS.accent);

    autoTable(doc, {
      startY: y,
      head: [["Shift", "Transactions", "Clients", "Value"]],
      body: shiftSummary.map((item: any) => [
        item.shift,
        item.count,
        item.clients,
        formatCurrency(item.value),
      ]),
      theme: "grid",
      styles: {
        fontSize: 10,
        cellPadding: 6,
        halign: "center",
      },
      headStyles: {
        fillColor: COLORS.accent,
        textColor: COLORS.lightText,
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [255, 250, 240],
      },
    });

    y = (doc as any).lastAutoTable.finalY + 30;

    // Footer
    doc.setFontSize(10).setFont("helvetica", "normal");
    doc.setTextColor(150, 150, 150);
    doc.text("Generated by Service Agent Dashboard", M, H - 20);
    doc.text(new Date().toLocaleString(), W - M, H - 20, { align: "right" });

    // Page numbers
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.text(`Page ${i} of ${pageCount}`, W / 2, H - 20, { align: "center" });
    }

    // Output
    const pdfArr = doc.output("arraybuffer");
    return new NextResponse(Buffer.from(pdfArr), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="service-report-${
          new Date().toISOString().split("T")[0]
        }.pdf"`,
      },
    });
  } catch (error) {
    console.error("PDF generation failed:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to generate PDF" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
