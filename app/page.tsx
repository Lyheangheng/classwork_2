"use client";

import { useEffect, useMemo, useState } from "react";

type Row = { year: number; district: string; communities: number; patients: number };
type ApiResponse = { rows?: Row[]; source?: string; updatedAt?: string; error?: string };

const colors = ["#b75d3b"];
const fmt = new Intl.NumberFormat("th-TH");

function LineChart({ data }: { data: { year: number; patients: number }[] }) {
  const max = Math.max(...data.map((d) => d.patients), 1);
  const points = data.map((item, index) => `${(index / Math.max(data.length - 1, 1)) * 100},${94 - (item.patients / max) * 76}`).join(" ");
  return <div className="line-wrap">
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="line-chart" role="img" aria-label="ผู้ป่วยเข้ารับบำบัดตามปี">
      <defs><linearGradient id="area" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#b75d3b" stopOpacity=".22" /><stop offset="100%" stopColor="#b75d3b" stopOpacity="0" /></linearGradient></defs>
      {[20, 45, 70, 94].map((y) => <line key={y} x1="0" x2="100" y1={y} y2={y} className="grid-line" />)}
      <polygon points={`0,94 ${points} 100,94`} fill="url(#area)" />
      <polyline points={points} fill="none" className="chart-line" />
      {data.map((item, index) => <circle key={item.year} cx={(index / Math.max(data.length - 1, 1)) * 100} cy={94 - (item.patients / max) * 76} r="1.8" className="chart-dot" />)}
    </svg>
    <div className="axis-labels">{data.map((item) => <span key={item.year}>{item.year}</span>)}</div>
  </div>;
}

function BarChart({ data }: { data: { district: string; patients: number }[] }) {
  const max = Math.max(...data.map((d) => d.patients), 1);
  return <div className="bars">{data.map((item, index) => <div className="bar-row" key={item.district}>
    <span className="bar-label">{item.district}</span><div className="bar-track"><div className="bar-fill" style={{ width: `${(item.patients / max) * 100}%`, background: colors[index % colors.length] }} /></div><b>{fmt.format(item.patients)}</b>
  </div>)}</div>;
}

export default function Home() {
  const [rows, setRows] = useState<Row[]>([]);
  const [year, setYear] = useState("all");
  const [district, setDistrict] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/data").then((response) => response.json() as Promise<ApiResponse>).then((result) => {
      if (result.error) setError(result.error); else setRows(result.rows ?? []);
    }).catch(() => setError("เชื่อมต่อแหล่งข้อมูลไม่สำเร็จ")).finally(() => setLoading(false));
  }, []);

  const years = useMemo(() => [...new Set(rows.map((row) => row.year))].sort(), [rows]);
  const districts = useMemo(() => [...new Set(rows.map((row) => row.district))].sort((a, b) => a.localeCompare(b, "th")), [rows]);
  const filtered = useMemo(() => rows.filter((row) => (year === "all" || row.year === Number(year)) && (district === "all" || row.district === district)), [rows, year, district]);
  const totalPatients = filtered.reduce((sum, row) => sum + row.patients, 0);
  const totalCommunities = filtered.reduce((sum, row) => sum + row.communities, 0);
  const trend = useMemo(() => years.map((item) => ({ year: item, patients: rows.filter((row) => row.year === item && (district === "all" || row.district === district)).reduce((sum, row) => sum + row.patients, 0) })).filter((item) => year === "all" || item.year === Number(year)), [rows, years, year, district]);
  const topDistricts = useMemo(() => {
    const grouped = new Map<string, number>();
    filtered.forEach((row) => grouped.set(row.district, (grouped.get(row.district) ?? 0) + row.patients));
    return [...grouped.entries()].map(([district, patients]) => ({ district, patients })).sort((a, b) => b.patients - a.patients).slice(0, 7);
  }, [filtered]);
  const latest = rows.length ? Math.max(...rows.map((row) => row.year)) : 0;
  const previous = latest - 1;
  const latestTotal = rows.filter((row) => row.year === latest).reduce((sum, row) => sum + row.patients, 0);
  const previousTotal = rows.filter((row) => row.year === previous).reduce((sum, row) => sum + row.patients, 0);
  const change = previousTotal ? Math.round(((latestTotal - previousTotal) / previousTotal) * 100) : 0;

  return <main>
    <header className="topbar"><div className="brand"><div className="brand-mark">ล</div><div><strong>LOM RAK</strong><small>COMMUNITY HEALTH INTELLIGENCE</small></div></div><div className="live"><i /> LIVE DATA <span>•</span> {new Date().toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}</div></header>
    <section className="hero"><div><p className="eyebrow">SI SA KET PROVINCE · THAILAND</p><h1>หมู่บ้านชุมชนล้อมรักษ์</h1><p className="subtitle">ภาพรวมข้อมูลผู้ป่วยเข้ารับบำบัด และการกระจายตัวในระดับอำเภอ</p></div><div className="hero-badge"><span>อัปเดตอัตโนมัติ</span><b>ON-THE-FLY</b></div></section>
    <div className="filters"><label>ปีการศึกษา<select value={year} onChange={(e) => setYear(e.target.value)}><option value="all">ทุกปี</option>{years.map((item) => <option key={item} value={item}>{item}</option>)}</select></label><label>อำเภอ<select value={district} onChange={(e) => setDistrict(e.target.value)}><option value="all">ทุกอำเภอ</option>{districts.map((item) => <option key={item} value={item}>{item}</option>)}</select></label><div className="filter-result">แสดง <b>{fmt.format(filtered.length)}</b> รายการ</div></div>
    {loading ? <div className="state">กำลังโหลดข้อมูล...</div> : error ? <div className="state error">{error}</div> : <><section className="kpis"><article><span>ผู้ป่วยเข้ารับบำบัด</span><strong>{fmt.format(totalPatients)}</strong><small className={change >= 0 ? "up" : "down"}>{change >= 0 ? "↗" : "↘"} {Math.abs(change)}% จากปีก่อน</small></article><article><span>หมู่บ้าน / ชุมชน</span><strong>{fmt.format(totalCommunities)}</strong><small>พื้นที่ที่มีข้อมูลในตัวกรอง</small></article><article><span>อำเภอที่เข้าร่วม</span><strong>{fmt.format(new Set(filtered.map((row) => row.district)).size)}</strong><small>จากทั้งหมด {fmt.format(districts.length)} อำเภอ</small></article><article className="accent"><span>ปีล่าสุด</span><strong>{latest || "—"}</strong><small>ข้อมูลล่าสุดในชุดข้อมูล</small></article></section>
      <section className="grid"><article className="card trend-card"><div className="card-head"><div><p className="eyebrow">YEARLY TREND</p><h2>แนวโน้มผู้ป่วยเข้ารับบำบัด</h2></div><span className="legend"><i /> ผู้ป่วย</span></div>{trend.length ? <LineChart data={trend} /> : <div className="empty">เลือกตัวกรองเพื่อดูแนวโน้ม</div>}</article><article className="card"><div className="card-head"><div><p className="eyebrow">TOP DISTRICTS</p><h2>อำเภอที่มีผู้ป่วยสูงสุด</h2></div><span className="muted">จัดอันดับ</span></div><BarChart data={topDistricts} /></article></section>
      <section className="card table-card"><div className="card-head"><div><p className="eyebrow">DATA EXPLORER</p><h2>ข้อมูลรายละเอียด</h2></div><span className="muted">{rows.length ? `เปรียบเทียบกับปี ${previous}` : ""}</span></div><div className="table-scroll"><table><thead><tr><th>ปี</th><th>อำเภอ</th><th>หมู่บ้าน / ชุมชน</th><th>ผู้ป่วยเข้ารับบำบัด</th><th>สัดส่วนของปี</th></tr></thead><tbody>{filtered.slice().sort((a, b) => b.year - a.year || b.patients - a.patients).map((row, index) => <tr key={`${row.year}-${row.district}`}><td><span className="year-pill">{row.year}</span></td><td>{row.district}</td><td>{row.communities}</td><td><b>{fmt.format(row.patients)}</b></td><td><div className="mini-track"><i style={{ width: `${Math.min(100, (row.patients / Math.max(...filtered.map((item) => item.patients), 1)) * 100)}%` }} /></div></td></tr>)}</tbody></table></div></section></>}
    <footer>แหล่งข้อมูล: Google Sheets <span>•</span> Dashboard จะดึงข้อมูลใหม่ทุกครั้งที่เปิดหรือรีเฟรชหน้า</footer>
  </main>;
}
