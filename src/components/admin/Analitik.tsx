import { lazy, Suspense, useState } from 'react'
import { PageHeader, PageLoading } from '../ui/page'

const Kehadiran = lazy(() => import('./TrenKehadiran'))
const Persentase = lazy(() => import('./PersentaseKehadiran'))
const Keterlambatan = lazy(() => import('./TrenKeterlambatan'))
const Kepulangan = lazy(() => import('./TrenJamPulang'))
const Statistik = lazy(() => import('./StatistikLengkap'))
const Peringkat = lazy(() => import('./LeaderboardGuru'))
const sections = ['Kehadiran', 'Keterlambatan', 'Kepulangan', 'Statistik Lengkap', 'Peringkat Guru']

export default function Analitik() {
  const [section, setSection] = useState(sections[0])
  return <div className="space-y-6">
    <PageHeader title="Analitik presensi" description="Lihat tren dan rincian kehadiran. Periode ditampilkan pada setiap analisis." />
    <div className="section-tabs" aria-label="Bagian analitik">{sections.map((item) => <button key={item} type="button" aria-pressed={section === item} onClick={() => setSection(item)}>{item}</button>)}</div>
    <Suspense fallback={<PageLoading />}>
      <section aria-label={section} key={section}>
        {section === 'Kehadiran' && <div className="grid gap-6 xl:grid-cols-2"><Kehadiran /><Persentase /></div>}
        {section === 'Keterlambatan' && <Keterlambatan />}
        {section === 'Kepulangan' && <Kepulangan />}
        {section === 'Statistik Lengkap' && <Statistik />}
        {section === 'Peringkat Guru' && <Peringkat />}
      </section>
    </Suspense>
  </div>
}
