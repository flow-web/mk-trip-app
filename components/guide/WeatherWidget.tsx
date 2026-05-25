'use client'

import { useState, useEffect } from 'react'
import { Cloud, Sun, CloudRain, Snowflake, Wind } from 'lucide-react'

interface Props {
  lat: number
  lng: number
}

interface Forecast {
  tempMin: number
  tempMax: number
  code: number
}

const WMO_ICONS: Record<number, typeof Sun> = {
  0: Sun, 1: Sun, 2: Cloud, 3: Cloud,
  45: Cloud, 48: Cloud,
  51: CloudRain, 53: CloudRain, 55: CloudRain,
  61: CloudRain, 63: CloudRain, 65: CloudRain,
  71: Snowflake, 73: Snowflake, 75: Snowflake,
  80: CloudRain, 81: CloudRain, 82: CloudRain,
  95: Wind, 96: Wind, 99: Wind,
}

export function WeatherWidget({ lat, lng }: Props) {
  const [forecast, setForecast] = useState<Forecast | null>(null)

  useEffect(() => {
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto&forecast_days=1`,
    )
      .then((r) => r.json())
      .then((data) => {
        if (data.daily) {
          setForecast({
            tempMin: Math.round(data.daily.temperature_2m_min[0]),
            tempMax: Math.round(data.daily.temperature_2m_max[0]),
            code: data.daily.weather_code[0],
          })
        }
      })
      .catch(() => {})
  }, [lat, lng])

  if (!forecast) return null

  const Icon = WMO_ICONS[forecast.code] ?? Cloud

  return (
    <div className="flex items-center gap-2">
      <Icon className="w-4 h-4 text-ink-mute" />
      <span className="mk-mono text-sm">{forecast.tempMin}–{forecast.tempMax}°</span>
    </div>
  )
}
