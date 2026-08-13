import { useState, useEffect } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts'
import { TrendingUp } from 'lucide-react'
import { adminChartsAPI } from '../../services/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '../ui/chart'
import { Skeleton } from '../ui/skeleton'

const chartConfig = {
  hadir: { label: 'Hadir', color: 'var(--chart-2)' },
  tidakHadir: { label: 'Tidak Hadir', color: 'var(--chart-4)' },
} satisfies ChartConfig

function TrenKehadiran() {
  const [chartData, setChartData] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ avgHadir: 0, avgTidakHadir: 0 })

  useEffect(() => {
    loadTrenData()
  }, [])

  const loadTrenData = async () => {
    try {
      setLoading(true)
      
      const response = await adminChartsAPI.getOverview()
      const chartArray = response.data?.trend7Days || []
      setChartData(chartArray)
      
      // Calculate average (hanya hari yang ada data)
      const daysWithData = chartArray.filter(day => day.hadir > 0 || day.tidakHadir > 0)
      const totalDays = daysWithData.length > 0 ? daysWithData.length : 7
      
      const totalHadir = chartArray.reduce((sum, day) => sum + day.hadir, 0)
      const totalTidakHadir = chartArray.reduce((sum, day) => sum + day.tidakHadir, 0)
      
      setStats({
        avgHadir: totalDays > 0 ? Math.round(totalHadir / totalDays) : 0,
        avgTidakHadir: totalDays > 0 ? Math.round(totalTidakHadir / totalDays) : 0
      })
      
    } catch (error) {
      console.error('Failed to load trend data:', error)
      // Set empty data on error
      setChartData([])
      setStats({ avgHadir: 0, avgTidakHadir: 0 })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className="p-6">
        <Skeleton className="mb-4 h-6 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </Card>
    )
  }

  return (
    <Card className="p-0">
      {/* Header */}
      <CardHeader className="flex-row items-center justify-between p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-blue-100 p-2 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <CardTitle className="text-lg">Tren Kehadiran</CardTitle>
            <CardDescription>7 Hari Terakhir</CardDescription>
          </div>
        </div>
        
        {/* Stats Summary */}
        <div className="flex gap-4">
          <div className="text-right">
            <p className="text-xs text-gray-500">Rata-rata Hadir</p>
            <p className="text-lg font-bold text-emerald-600">{stats.avgHadir}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Rata-rata Tidak Hadir</p>
            <p className="text-lg font-bold text-rose-600">{stats.avgTidakHadir}</p>
          </div>
        </div>
      </CardHeader>

      {/* Chart */}
      <CardContent className="px-6">
        <ChartContainer config={chartConfig} className="min-h-[320px]">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              {/* Gradient untuk Hadir */}
              <linearGradient id="colorHadir" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-hadir)" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="var(--color-hadir)" stopOpacity={0}/>
              </linearGradient>
              {/* Gradient untuk Tidak Hadir */}
              <linearGradient id="colorTidakHadir" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-tidakHadir)" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="var(--color-tidakHadir)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            
            <XAxis 
              dataKey="tanggal" 
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            
            <YAxis 
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
              allowDecimals={false}
              label={{ value: 'Jumlah Guru', angle: -90, position: 'insideLeft', style: { fontSize: '12px', fill: '#6b7280' } }}
            />
            
            <ChartTooltip content={<ChartTooltipContent />} />
            
            {/* Area Hadir */}
            <Area 
              type="monotone" 
              dataKey="hadir" 
              stroke="var(--color-hadir)"
              strokeWidth={2}
              fill="url(#colorHadir)" 
              name="Hadir"
            />
            
            {/* Area Tidak Hadir */}
            <Area 
              type="monotone" 
              dataKey="tidakHadir" 
              stroke="var(--color-tidakHadir)"
              strokeWidth={2}
              fill="url(#colorTidakHadir)" 
              name="Tidak Hadir"
            />
          </AreaChart>
        </ChartContainer>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-emerald-500"></div>
          <span className="text-sm text-gray-600">Hadir</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-rose-500"></div>
          <span className="text-sm text-gray-600">Tidak Hadir (Izin/Sakit)</span>
        </div>
      </div>
      </CardContent>
    </Card>
  )
}

export default TrenKehadiran
