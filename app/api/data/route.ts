import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function parseCsv(csv: string) {
  const lines = csv.replace(/^\uFEFF/, "").trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((value) => value.trim().replace(/^"|"$/g, ""));
    return {
      year: Number(values[0]),
      district: values[1] ?? "",
      communities: Number(values[2]) || 0,
      patients: Number(values[3]) || 0
    };
  }).filter((row) => row.district && Number.isFinite(row.year));
}

export async function GET() {
  const remoteUrl = process.env.GOOGLE_SHEET_CSV_URL;
  try {
    let csv: string;
    if (remoteUrl) {
      const response = await fetch(remoteUrl, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Google Sheet returned HTTP ${response.status}`);
      }
      csv = await response.text();
    } else {
      csv = await fs.readFile(path.join(process.cwd(), "หมู่บ้านชุมชนล้อมรักษ์.csv"), "utf8");
    }
    const rows = parseCsv(csv);
    if (!rows.length) {
      throw new Error("Data source contains no usable rows");
    }
    return NextResponse.json({ rows, source: remoteUrl ? "google-sheet" : "local-csv", updatedAt: new Date().toISOString() });
  } catch (error) {
    console.error("Unable to load dashboard data", error);
    return NextResponse.json({ error: "Unable to load data source." }, { status: 502 });
  }
}
