import { useState, useEffect, useCallback } from 'react'
import {
  ComposedChart, Area, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts'
import { TrendingUp, TrendingDown, Minus, GitCompare, BarChart2, Calendar } from 'lucide-react'
import { presensiAPI } from '../../services/api'

// ─── Helpers ────────────────────────────────────────────────────────────────

const toDateStr = (d) => d.toISOString().split('T')[0]

const addDays = (dateStr, n) => {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + n)
  return toDateStr(d)
}

const formatLabel = (dateStr) => {
  const d = new Date(dateStr)
  const days = ['Min','Sen','Sel','Rab','Kam','Jum','Sab']
  return `${days[d.getDay()]} ${d.getDate()}/${d.getMonth()+1}`
}

const buildDateRange = (startStr, endStr) => {
  const result = []
  let cur = startStr
  while (cur <= endStr) {
    result.push(cur)
    cur = addDays(cur, 1)
  }
  return result
}

// Hitung statistik dari array log untuk rentang tanggal tertentu
const computeStats = (logs, startStr, endStr) => {
  const dates = buildDateRange(startStr, endStr)
  const byDate = {}
  dates.forEach(d => {
    byDate[d] = { hadir: 0, terlambat: 0, tidakHadir: 0, tanggal: d }
  })
  logs.forEach(log => {
    if (!byDate[log.tanggal]) return
    const s = log.status
    if (s === 'hadir' || s === 'hadir_izin_terlambat') byDate[log.tanggal].hadir++
    else if (s === 'hadir_terlambat') byDate[log.tanggal].terlambat++
    else byDate[log.tanggal].tidakHadir++
  })
  return Object.values(byDate)
}

const aggregateStats = (rows) => {
  const totalHadir = rows.reduce((s, r) => s + r.hadir, 0)
  const totalTerlambat = rows.reduce((s, r) => s + r.terlambat, 0)
  const totalTidak = rows.reduce((s, r) => s + r.tidakHadir, 0)
  const totalScan = totalHadir + totalTerlambat + totalTidak
  return {
    hadir: totalHadir,
    terlambat: totalTerlambat,
    tidakHadir: totalTidak,
    pctTerlambat: totalScan > 0 ? ((totalTerlambat / totalScan) * 100).toFixed(1) : '0.0',
    pctHadir: totalScan > 0 ? ((totalHadir / totalScan) * 100).toFixed(1) : '0.0',
  }
}

// ─── Custom Tooltip ─────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-sm min-w-[180px]">
      <p className="font-semibold text-gray-700 mb-2">{formatLabel(label)}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center justify-between gap-4 mb-1">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }}/>
            <span className="text-gray-600">{p.name}</span>
          </div>
          <span className="font-bold text-gray-800">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Comparison Tooltip ──────────────────────────────────────────────────────

const CompareTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-sm min-w-[200px]">
      <p className="font-semibold text-gray-700 mb-2">Hari ke-{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center justify-between gap-4 mb-1">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: p.fill || p.color }}/>
            <span className="text-gray-600">{p.name}</span>
          </div>
          <span className="font-bold text-gray-800">{p.value}%</span>
        </div>
      ))}
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

function TrenKeterlambatan() {
  const todayStr = toDateStr(new Date())
  const thirtyAgo = addDays(todayStr, -29)
  const fifteenAgo = addDays(todayStr, -14)

  // Mode: 'trend' | 'compare'
  const [mode, setMode] = useState('trend')

  // Periode A (mode trend & compare)
  const [periodeA, setPeriodeA] = useState({ start: addDays(todayStr, -13), end: todayStr })
  // Periode B (mode compare)
  const [periodeB, setPeriodeB] = useState({ start: addDays(todayStr, -27), end: addDays(todayStr, -14) })

  const [allLogs, setAllLogs] = useState([])
  const [loading, setLoading] = useState(true)

  // Chart data
  const [trendData, setTrendData] = useState([])
  const [compareData, setCompareData] = useState([])
  const [statsA, setStatsA] = useState({ hadir: 0, terlambat: 0, tidakHadir: 0, pctTerlambat: '0.0', pctHadir: '0.0' })
  const [statsB, setStatsB] = useState({ hadir: 0, terlambat: 0, tidakHadir: 0, pctTerlambat: '0.0', pctHadir: '0.0' })

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const response = await presensiAPI.getAll()
      setAllLogs(response.data || [])
    } catch (e) {
      console.error('TrenKeterlambatan: gagal muat data', e)
    } finally {
      setLoading(false)
    }
  }

  // Rebuild chart data tiap kali logs/periode berubah
  const rebuild = useCallback(() => {
    if (!allLogs.length) return

    // Trend data
    const rowsA = computeStats(allLogs, periodeA.start, periodeA.end)
    setTrendData(rowsA)
    setStatsA(aggregateStats(rowsA))

    // Compare data: normalisasi ke "Hari ke-N" agar bisa di-overlay
    const rowsB = computeStats(allLogs, periodeB.start, periodeB.end)
    const maxLen = Math.max(rowsA.length, rowsB.length)
    const cmp = []
    for (let i = 0; i < maxLen; i++) {
      const a = rowsA[i]
      const b = rowsB[i]
      const totalA = a ? a.hadir + a.terlambat + a.tidakHadir : 0
      const totalB = b ? b.hadir + b.terlambat + b.tidakHadir : 0
      cmp.push({
        day: i + 1,
        'Terlambat A': totalA > 0 ? +((a.terlambat / totalA) * 100).toFixed(1) : 0,
        'Terlambat B': totalB > 0 ? +((b.terlambat / totalB) * 100).toFixed(1) : 0,
        'Hadir A': totalA > 0 ? +((a.hadir / totalA) * 100).toFixed(1) : 0,
        'Hadir B': totalB > 0 ? +((b.hadir / totalB) * 100).toFixed(1) : 0,
      })
    }
    setCompareData(cmp)
    setStatsB(aggregateStats(rowsB))
  }, [allLogs, periodeA, periodeB])

  useEffect(() => { rebuild() }, [rebuild])

  // ─── Delta indicator ────────────────────────────────────────────────────
  const delta = parseFloat(statsA.pctTerlambat) - parseFloat(statsB.pctTerlambat)
  const DeltaIcon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus
  const deltaColor = delta > 0 ? 'text-red-600' : delta < 0 ? 'text-emerald-600' : 'text-gray-500'
  const deltaBg = delta > 0 ? 'bg-red-50 border-red-200' : delta < 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-200'
  const deltaLabel = delta > 0 ? `Meningkat ${Math.abs(delta).toFixed(1)}%` : delta < 0 ? `Menurun ${Math.abs(delta).toFixed(1)}%` : 'Tidak berubah'

  // ─── Skeleton ────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="bg-white rounded-2xl shadow p-6 col-span-full animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"/>
      <div className="h-72 bg-gray-100 rounded"/>
    </div>
  )

  return (
    <div className="bg-white rounded-2xl shadow p-6 col-span-full">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 rounded-xl">
            <BarChart2 className="w-5 h-5 text-orange-600"/>
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-800">Tren Kehadiran & Keterlambatan</h2>
            <p className="text-xs text-gray-500">Hadir tepat waktu • Terlambat • Tidak hadir</p>
          </div>
        </div>

        {/* Mode toggle */}
        <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-1">
          <button
            onClick={() => setMode('trend')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              mode === 'trend' ? 'bg-white shadow text-blue-700' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5"/> Tren
          </button>
          <button
            onClick={() => setMode('compare')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              mode === 'compare' ? 'bg-white shadow text-purple-700' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <GitCompare className="w-3.5 h-3.5"/> Bandingkan
          </button>
        </div>
      </div>

      {/* ── Period Controls ─────────────────────────────────────────────── */}
      <div className={`grid gap-3 mb-6 ${mode === 'compare' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-1'}`}>
        {/* Periode A */}
        <div className={`flex flex-wrap items-center gap-2 px-4 py-2.5 rounded-xl border ${mode === 'compare' ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-gray-50'}`}>
          <Calendar className={`w-4 h-4 ${mode === 'compare' ? 'text-blue-500' : 'text-gray-500'}`}/>
          <span className={`text-xs font-semibold ${mode === 'compare' ? 'text-blue-700' : 'text-gray-700'}`}>
            {mode === 'compare' ? 'Periode A' : 'Periode'}
          </span>
          <input type="date" value={periodeA.start} max={periodeA.end}
            onChange={e => setPeriodeA(p => ({ ...p, start: e.target.value }))}
            className="text-xs px-2 py-1 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-300 outline-none"
          />
          <span className="text-xs text-gray-400">s/d</span>
          <input type="date" value={periodeA.end} min={periodeA.start} max={todayStr}
            onChange={e => setPeriodeA(p => ({ ...p, end: e.target.value }))}
            className="text-xs px-2 py-1 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-300 outline-none"
          />
        </div>

        {/* Periode B — hanya tampil saat mode compare */}
        {mode === 'compare' && (
          <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 rounded-xl border border-purple-200 bg-purple-50">
            <Calendar className="w-4 h-4 text-purple-500"/>
            <span className="text-xs font-semibold text-purple-700">Periode B</span>
            <input type="date" value={periodeB.start} max={periodeB.end}
              onChange={e => setPeriodeB(p => ({ ...p, start: e.target.value }))}
              className="text-xs px-2 py-1 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-300 outline-none"
            />
            <span className="text-xs text-gray-400">s/d</span>
            <input type="date" value={periodeB.end} min={periodeB.start}
              onChange={e => setPeriodeB(p => ({ ...p, end: e.target.value }))}
              className="text-xs px-2 py-1 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-300 outline-none"
            />
          </div>
        )}
      </div>

      {/* ── Mode: TREND ─────────────────────────────────────────────────── */}
      {mode === 'trend' && (
        <>
          {/* Stat pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            <div className="bg-emerald-50 rounded-xl p-3 text-center border border-emerald-100">
              <p className="text-xs text-gray-500 mb-0.5">Tepat Waktu</p>
              <p className="text-xl font-bold text-emerald-600">{statsA.hadir}</p>
              <p className="text-xs text-emerald-500">{statsA.pctHadir}%</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-3 text-center border border-amber-100">
              <p className="text-xs text-gray-500 mb-0.5">Terlambat</p>
              <p className="text-xl font-bold text-amber-600">{statsA.terlambat}</p>
              <p className="text-xs text-amber-500">{statsA.pctTerlambat}%</p>
            </div>
            <div className="bg-rose-50 rounded-xl p-3 text-center border border-rose-100">
              <p className="text-xs text-gray-500 mb-0.5">Tidak Hadir</p>
              <p className="text-xl font-bold text-rose-600">{statsA.tidakHadir}</p>
            </div>
            <div className="bg-orange-50 rounded-xl p-3 text-center border border-orange-100">
              <p className="text-xs text-gray-500 mb-0.5">% Terlambat</p>
              <p className="text-2xl font-bold text-orange-600">{statsA.pctTerlambat}%</p>
            </div>
          </div>

          {/* Chart */}
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={trendData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gHadir" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gTerlambat" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gTidak" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.20}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                <XAxis dataKey="tanggal" tickFormatter={formatLabel} style={{ fontSize: 11 }} stroke="#9ca3af"/>
                <YAxis allowDecimals={false} style={{ fontSize: 11 }} stroke="#9ca3af"/>
                <Tooltip content={<CustomTooltip/>}/>
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }}/>
                <Area type="monotone" dataKey="hadir" name="Hadir Tepat Waktu"
                  stroke="#10b981" strokeWidth={2} fill="url(#gHadir)" dot={{ r: 3, fill: '#10b981' }}/>
                <Area type="monotone" dataKey="terlambat" name="Hadir Terlambat"
                  stroke="#f59e0b" strokeWidth={2} fill="url(#gTerlambat)" dot={{ r: 3, fill: '#f59e0b' }}/>
                <Area type="monotone" dataKey="tidakHadir" name="Tidak Hadir"
                  stroke="#f43f5e" strokeWidth={2} fill="url(#gTidak)" dot={{ r: 3, fill: '#f43f5e' }}/>
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* ── Mode: COMPARE ───────────────────────────────────────────────── */}
      {mode === 'compare' && (
        <>
          {/* Delta indicator */}
          <div className={`flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl border mb-5 ${deltaBg}`}>
            <div className={`flex items-center gap-2 ${deltaColor}`}>
              <DeltaIcon className="w-6 h-6"/>
              <span className="text-lg font-bold">{deltaLabel}</span>
            </div>
            <div className="flex-1 text-sm text-gray-600 text-center sm:text-left">
              Persentase terlambat periode A <strong className="text-blue-700">{statsA.pctTerlambat}%</strong> vs periode B <strong className="text-purple-700">{statsB.pctTerlambat}%</strong>
            </div>
          </div>

          {/* Summary cards A & B */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            {/* A */}
            <div className="border border-blue-200 rounded-xl p-3 bg-blue-50">
              <p className="text-xs font-bold text-blue-700 mb-2">Periode A</p>
              <p className="text-xs text-gray-500">{periodeA.start} → {periodeA.end}</p>
              <div className="mt-2 grid grid-cols-3 gap-1 text-center">
                <div><p className="text-xs text-gray-500">Tepat</p><p className="font-bold text-emerald-600">{statsA.hadir}</p></div>
                <div><p className="text-xs text-gray-500">Lambat</p><p className="font-bold text-amber-600">{statsA.terlambat}</p></div>
                <div><p className="text-xs text-gray-500">Absen</p><p className="font-bold text-rose-600">{statsA.tidakHadir}</p></div>
              </div>
              <div className="mt-2 text-center">
                <span className="text-sm font-bold text-blue-700">% Terlambat: {statsA.pctTerlambat}%</span>
              </div>
            </div>
            {/* B */}
            <div className="border border-purple-200 rounded-xl p-3 bg-purple-50">
              <p className="text-xs font-bold text-purple-700 mb-2">Periode B</p>
              <p className="text-xs text-gray-500">{periodeB.start} → {periodeB.end}</p>
              <div className="mt-2 grid grid-cols-3 gap-1 text-center">
                <div><p className="text-xs text-gray-500">Tepat</p><p className="font-bold text-emerald-600">{statsB.hadir}</p></div>
                <div><p className="text-xs text-gray-500">Lambat</p><p className="font-bold text-amber-600">{statsB.terlambat}</p></div>
                <div><p className="text-xs text-gray-500">Absen</p><p className="font-bold text-rose-600">{statsB.tidakHadir}</p></div>
              </div>
              <div className="mt-2 text-center">
                <span className="text-sm font-bold text-purple-700">% Terlambat: {statsB.pctTerlambat}%</span>
              </div>
            </div>
          </div>

          {/* Comparison bar chart — % terlambat per hari */}
          <p className="text-xs text-gray-500 mb-2 text-center">Persentase Terlambat per Hari (%)</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={compareData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                <XAxis dataKey="day" label={{ value: 'Hari ke-', position: 'insideBottom', offset: -2, style: { fontSize: 10 } }} style={{ fontSize: 11 }} stroke="#9ca3af"/>
                <YAxis tickFormatter={v => `${v}%`} domain={[0, 'auto']} style={{ fontSize: 11 }} stroke="#9ca3af"/>
                <Tooltip content={<CompareTooltip/>}/>
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }}/>
                <ReferenceLine y={0} stroke="#e5e7eb"/>
                <Bar dataKey="Terlambat A" fill="#3b82f6" radius={[3,3,0,0]} opacity={0.85}/>
                <Bar dataKey="Terlambat B" fill="#a855f7" radius={[3,3,0,0]} opacity={0.85}/>
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Legend delta warna */}
          <div className="flex items-center justify-center gap-6 mt-3 text-xs text-gray-500">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-blue-500"/><span>Periode A</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-purple-500"/><span>Periode B</span></div>
            <div className="flex items-center gap-1.5 text-gray-400">(Bar lebih tinggi = lebih banyak terlambat)</div>
          </div>
        </>
      )}
    </div>
  )
}

export default TrenKeterlambatan
