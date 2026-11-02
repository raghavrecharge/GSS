import { useEffect, useState } from 'react'
import staticContent from './msbmContentPages.json'
import staticCountries from './msbmCountries.json'
import staticRegions from './msbmRegions.json'

const fallback = { content: staticContent, countries: staticCountries, regions: staticRegions, source: 'static' }
let cache = null

async function readDataset(name, signal) {
  const response = await fetch(`/api/${name}`, { credentials: 'same-origin', headers: { Accept: 'application/json' }, signal })
  if (!response.ok) throw new Error(`${name} request failed`)
  const payload = await response.json()
  if (!Array.isArray(payload.data)) throw new Error(`${name} response is invalid`)
  return payload.data
}

export function useSharedData() {
  const [data, setData] = useState(cache || fallback)
  useEffect(() => {
    const controller = new AbortController()
    Promise.all(['content', 'countries', 'regions'].map((name) => readDataset(name, controller.signal)))
      .then(([content, countries, regions]) => {
        cache = { content, countries, regions, source: 'database' }
        setData(cache)
      })
      .catch(() => {})
    return () => controller.abort()
  }, [])
  return data
}
