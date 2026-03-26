import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function fmt(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const ROLE_LABELS: Record<string, string> = {
  leader: "Leader",
  customer_rep: "Customer Rep",
  customer_rep_asst: "Customer Rep Assistant",
};

const ROLE_ORDER = ["leader", "customer_rep", "customer_rep_asst"] as const;
const SHIFTS = ["MORNING", "MID", "NIGHT"] as const;

const BRAND_COLOR: [number, number, number] = [17, 24, 39]; // gray-900
const ACCENT_COLOR: [number, number, number] = [59, 130, 246]; // blue-500
const LIGHT_BG: [number, number, number] = [249, 250, 251]; // gray-50
const BORDER_COLOR: [number, number, number] = [229, 231, 235]; // gray-200

interface MemberRow {
  memberId: string;
  name: string;
  teamRole: string;
  shift: string;
  firstDepositCount: number;
  firstDepositTotal: number;
  rechargeTotal: number;
  totalWithdrawals: number;
  total: number;
  percentage: number;
  commission: number;
  totalConversion: number;
}

interface PdfParams {
  filterLabel: string;
  rows: MemberRow[];
}

function renderShiftPage(doc: jsPDF, shift: string, shiftRows: MemberRow[], filterLabel: string) {
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  // Accent bar at top
  doc.setFillColor(...ACCENT_COLOR);
  doc.rect(0, 0, pageWidth, 4, "F");

  // Title
  y = 18;
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BRAND_COLOR);
  doc.text(`${shift} Shift`, 14, y);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 120, 120);
  doc.text("Commission Report", 14, y + 7);

  // Right side info
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(filterLabel, pageWidth - 14, y, { align: "right" });
  doc.text(
    new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
    pageWidth - 14, y + 5, { align: "right" }
  );

  y += 14;

  // Shift summary cards
  const shiftFirstDep = shiftRows.reduce((s, r) => s + r.firstDepositTotal, 0);
  const shiftRecharge = shiftRows.reduce((s, r) => s + r.rechargeTotal, 0);
  const shiftWithdraw = shiftRows.reduce((s, r) => s + r.totalWithdrawals, 0);
  const shiftTotal = shiftRows.reduce((s, r) => s + r.total, 0);
  const shiftCommission = shiftRows.reduce((s, r) => s + r.commission, 0);
  // Deduplicate: only count from non-leader rows
  const nonLeaderRows = shiftRows.filter((r) => r.teamRole !== "leader");
  const dedupFirstDep = nonLeaderRows.reduce((s, r) => s + r.firstDepositTotal, 0);
  const dedupRecharge = nonLeaderRows.reduce((s, r) => s + r.rechargeTotal, 0);
  const dedupWithdraw = nonLeaderRows.reduce((s, r) => s + r.totalWithdrawals, 0);
  const dedupTotal = nonLeaderRows.reduce((s, r) => s + r.total, 0);

  const summaryItems = [
    { label: "1st Deposit", value: fmt(dedupFirstDep), color: [220, 38, 38] as [number, number, number] },
    { label: "Recharge", value: fmt(dedupRecharge), color: [22, 163, 74] as [number, number, number] },
    { label: "Withdraw", value: fmt(dedupWithdraw), color: [217, 119, 6] as [number, number, number] },
    { label: "Total", value: fmt(dedupTotal), color: BRAND_COLOR },
  ];

  const cardWidth = (pageWidth - 28 - 12) / 4; // 4 cards, 14px margin each side, 4px gap x3
  for (let i = 0; i < summaryItems.length; i++) {
    const x = 14 + i * (cardWidth + 4);
    const item = summaryItems[i];

    // Card background
    doc.setFillColor(...LIGHT_BG);
    doc.setDrawColor(...BORDER_COLOR);
    doc.roundedRect(x, y, cardWidth, 18, 2, 2, "FD");

    // Label
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 120, 120);
    doc.text(item.label.toUpperCase(), x + 4, y + 6);

    // Value
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...item.color);
    doc.text(item.value, x + 4, y + 14);
  }

  y += 26;

  // Role tables
  for (const role of ROLE_ORDER) {
    const roleRows = shiftRows.filter((r) => r.teamRole === role);
    if (roleRows.length === 0) continue;

    if (y > doc.internal.pageSize.getHeight() - 40) {
      doc.addPage();
      // Re-draw accent bar on new page
      doc.setFillColor(...ACCENT_COLOR);
      doc.rect(0, 0, pageWidth, 4, "F");
      y = 18;
    }

    // Role section header with accent line
    doc.setFillColor(...ACCENT_COLOR);
    doc.rect(14, y, 3, 8, "F");
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...BRAND_COLOR);
    doc.text(ROLE_LABELS[role], 20, y + 6);
    y += 12;

    const tableHead = [
      "Name", "1st Dep #", "1st Dep Total", "Recharge", "Withdraw", "Total", "%", "Commission", "Comm in P",
    ];

    const tableBody = roleRows.map((r) => [
      r.name,
      String(r.firstDepositCount),
      fmt(r.firstDepositTotal),
      fmt(r.rechargeTotal),
      fmt(r.totalWithdrawals),
      fmt(r.total),
      `${r.percentage.toFixed(2)}%`,
      fmt(r.commission),
      fmt(r.totalConversion),
    ]);

    if (role !== "leader" && roleRows.length > 1) {
      const sub = roleRows.reduce(
        (a, r) => ({
          fd: a.fd + r.firstDepositCount, fdt: a.fdt + r.firstDepositTotal,
          rc: a.rc + r.rechargeTotal, wd: a.wd + r.totalWithdrawals,
          t: a.t + r.total, c: a.c + r.commission, tc: a.tc + r.totalConversion,
        }),
        { fd: 0, fdt: 0, rc: 0, wd: 0, t: 0, c: 0, tc: 0 }
      );
      tableBody.push([
        "SUBTOTAL", String(sub.fd), fmt(sub.fdt), fmt(sub.rc), fmt(sub.wd),
        fmt(sub.t), sub.t > 0 ? `${((sub.c / sub.t) * 100).toFixed(2)}%` : "0.00%",
        fmt(sub.c), fmt(sub.tc),
      ]);
    }

    autoTable(doc, {
      startY: y,
      head: [tableHead],
      body: tableBody,
      theme: "plain",
      headStyles: {
        fillColor: LIGHT_BG,
        textColor: [75, 85, 99],
        fontSize: 7,
        halign: "right",
        fontStyle: "bold",
        cellPadding: { top: 3, bottom: 3, left: 3, right: 3 },
      },
      bodyStyles: {
        fontSize: 8.5,
        halign: "right",
        textColor: BRAND_COLOR,
        cellPadding: { top: 2.5, bottom: 2.5, left: 3, right: 3 },
      },
      columnStyles: {
        0: { halign: "left", fontStyle: "bold", cellWidth: 42 },
        6: { textColor: [107, 114, 128] },  // % column muted
        7: { textColor: ACCENT_COLOR, fontStyle: "bold" },  // Commission blue
        8: { textColor: [124, 58, 237], fontStyle: "bold" }, // Comm in P purple
      },
      styles: {
        lineColor: BORDER_COLOR,
        lineWidth: 0,
      },
      margin: { left: 14, right: 14 },
      didDrawCell: (data) => {
        // Draw bottom border for each row
        if (data.section === "head" || data.section === "body") {
          doc.setDrawColor(...BORDER_COLOR);
          doc.setLineWidth(0.3);
          const { x, y, width, height } = data.cell;
          doc.line(x, y + height, x + width, y + height);
        }
      },
      didParseCell: (data) => {
        const isSubtotal = data.section === "body" && data.row.index === tableBody.length - 1 && roleRows.length > 1 && role !== "leader";
        if (isSubtotal) {
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.fillColor = [243, 244, 246];
          data.cell.styles.textColor = BRAND_COLOR;
        }
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    y = (doc as any).lastAutoTable.finalY + 12;
  }
}

function buildPdf({ filterLabel, rows }: PdfParams): jsPDF {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();

  let isFirstPage = true;

  for (const shift of SHIFTS) {
    const shiftRows = rows.filter((r) => r.shift === shift);
    if (shiftRows.length === 0) continue;

    if (!isFirstPage) doc.addPage();
    isFirstPage = false;

    renderShiftPage(doc, shift, shiftRows, filterLabel);
  }

  // Page footers
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalPages = (doc as any).getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Footer line
    doc.setDrawColor(...BORDER_COLOR);
    doc.setLineWidth(0.3);
    doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);

    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(160, 160, 160);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - 14, pageHeight - 7, { align: "right" });
    doc.text("Bot Chatter", 14, pageHeight - 7);
    doc.text(filterLabel, pageWidth / 2, pageHeight - 7, { align: "center" });
  }

  return doc;
}

export function previewCommissionPdf(params: PdfParams): string {
  const doc = buildPdf(params);
  const blob = doc.output("blob");
  return URL.createObjectURL(blob);
}

export function downloadCommissionPdf(params: PdfParams) {
  const doc = buildPdf(params);
  doc.save(`commission-${params.filterLabel.replace(/\s+/g, "-").toLowerCase()}.pdf`);
}
