import { createClient } from '@supabase/supabase-js'
import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState } from 'react'

// Verified aggregate results from the GreenMap field survey (20 September 2026).
// These are totals only; individual tree-to-zone, condition, and GPS assignments
// were not supplied, so the application must not fabricate those details.
export const VERIFIED_INVENTORY = {
  projectKey: 'theem-campus-2026',
  surveyDate: '2026-09-20',
  totalTrees: 38,
  speciesCounts: [
    { name: 'Neem', count: 2 },
    { name: 'Gulmohar', count: 9 },
    { name: 'Ashoka', count: 1 },
    { name: 'Bore', count: 2 },
    { name: 'Sitaphal', count: 3 },
    { name: 'Amrud', count: 1 },
    { name: 'Jamun', count: 2 },
    { name: 'Khajur', count: 3 },
    { name: 'Black Jamun', count: 4 },
    { name: 'White Jamun', count: 2 },
    { name: 'Badam', count: 2 },
    { name: 'Other / not identified', count: 7 },
  ],
  zoneCounts: [
    { name: 'Main Ground', count: 10 },
    { name: 'Volleyball Ground', count: 21 },
    { name: 'Flower Garden', count: 0 },
    { name: 'Parking', count: 7 },
  ],
  conditionCounts: [
    { name: 'Healthy', count: 25 },
    { name: 'Needs Attention', count: 10 },
    { name: 'Uncertain', count: 3 },
  ],
  verified: true,
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY
export const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null

const mapTree = (row) => ({
  id: row.tree_id,
  common: row.common_name,
  scientific: row.scientific_name || '',
  family: row.family || '',
  zone: row.location_zone || 'Zone not recorded',
  condition: row.condition || 'Uncertain',
  date: row.date_surveyed || '',
  lat: row.latitude,
  lng: row.longitude,
  remark: row.remarks || '',
  image: row.photo_url || '',
  isDemo: Boolean(row.is_demo),
})
const mapSpace = (row) => ({
  name: row.name,
  type: row.space_type || 'Green space',
  location: row.location || 'Location not recorded',
  area: row.area !== null && row.area !== undefined ? `${Number(row.area).toLocaleString()} m²` : 'Area not recorded',
  condition: row.condition || 'Not assessed',
  description: row.description || '',
  lat: row.latitude,
  lng: row.longitude,
  image: row.photo_url || '',
  isDemo: Boolean(row.is_demo),
})
const mapGallery = (row) => [row.title, row.category || 'Uncategorised', row.location || 'Location not recorded', row.image_url || '', row.date_taken || '']

const emptyData = () => ({
  trees: [],
  spaces: [],
  gallery: [],
  surveyCount: 0,
  inventorySummary: VERIFIED_INVENTORY,
  loading: Boolean(supabase),
  connected: Boolean(supabase),
  error: null,
})

const DataContext = createContext(null)

export function GreenMapProvider({ children }) {
  const [data, setData] = useState(emptyData)
  const [refreshKey, setRefreshKey] = useState(0)
  const refresh = useCallback(() => setRefreshKey((value) => value + 1), [])

  const requireDatabase = () => {
    if (!supabase) throw new Error('Supabase is not configured. Database changes are disabled until valid environment variables are added.')
  }

  const createTree = useCallback(async (tree) => {
    requireDatabase()
    const { error } = await supabase.from('trees').insert({
      tree_id: tree.id,
      common_name: tree.common,
      scientific_name: tree.scientific || null,
      family: tree.family || null,
      location_zone: tree.zone,
      latitude: tree.lat === '' || tree.lat === null ? null : Number(tree.lat),
      longitude: tree.lng === '' || tree.lng === null ? null : Number(tree.lng),
      condition: tree.condition || 'Uncertain',
      date_surveyed: tree.date || null,
      remarks: tree.remark || null,
      photo_url: tree.image || null,
      is_demo: false,
    })
    if (error) throw error
    refresh()
  }, [refresh])

  const updateTree = useCallback(async (tree) => {
    requireDatabase()
    const { error } = await supabase.from('trees').update({
      common_name: tree.common,
      scientific_name: tree.scientific || null,
      family: tree.family || null,
      location_zone: tree.zone,
      latitude: tree.lat === '' || tree.lat === null ? null : Number(tree.lat),
      longitude: tree.lng === '' || tree.lng === null ? null : Number(tree.lng),
      condition: tree.condition || 'Uncertain',
      date_surveyed: tree.date || null,
      remarks: tree.remark || null,
      photo_url: tree.image || null,
      updated_at: new Date().toISOString(),
    }).eq('tree_id', tree.id)
    if (error) throw error
    refresh()
  }, [refresh])

  const deleteTree = useCallback(async (treeId) => {
    requireDatabase()
    const { error } = await supabase.from('trees').delete().eq('tree_id', treeId)
    if (error) throw error
    refresh()
  }, [refresh])

  useEffect(() => {
    if (!supabase) return undefined
    let active = true
    const load = async () => {
      const [treeResult, spaceResult, galleryResult, surveyResult, summaryResult] = await Promise.all([
        supabase.from('trees').select('*').order('tree_id'),
        supabase.from('green_spaces').select('*').order('name'),
        supabase.from('gallery').select('*').order('created_at', { ascending: false }),
        supabase.rpc('get_survey_response_count'),
        supabase.from('survey_inventory_summary').select('*').eq('project_key', VERIFIED_INVENTORY.projectKey).maybeSingle(),
      ])
      const firstError = treeResult.error || spaceResult.error || galleryResult.error || surveyResult.error
      if (!active) return
      if (firstError) {
        setData((current) => ({ ...current, loading: false, connected: true, error: firstError.message }))
        return
      }
      const summaryRow = summaryResult.error ? null : summaryResult.data
      const inventorySummary = summaryRow ? {
        projectKey: summaryRow.project_key,
        surveyDate: summaryRow.survey_date || VERIFIED_INVENTORY.surveyDate,
        totalTrees: Number(summaryRow.total_trees),
        speciesCounts: Object.entries(summaryRow.species_counts || {}).map(([name, count]) => ({ name, count: Number(count) })),
        zoneCounts: Object.entries(summaryRow.zone_counts || {}).map(([name, count]) => ({ name, count: Number(count) })),
        conditionCounts: Object.entries(summaryRow.condition_counts || {}).map(([name, count]) => ({ name, count: Number(count) })),
        verified: Boolean(summaryRow.verified),
      } : VERIFIED_INVENTORY
      setData({
        trees: (treeResult.data || []).map(mapTree),
        spaces: (spaceResult.data || []).map(mapSpace),
        gallery: (galleryResult.data || []).map(mapGallery),
        surveyCount: Number(surveyResult.data || 0),
        inventorySummary,
        loading: false,
        connected: true,
        error: null,
      })
    }
    load()
    return () => { active = false }
  }, [refreshKey])

  const value = useMemo(() => ({
    ...data,
    refresh,
    createTree,
    updateTree,
    deleteTree,
    // No fabricated individual records are used when the database is unavailable.
    demoMode: !supabase || Boolean(data.error),
    adminRoleRequired: true,
  }), [data, refresh, createTree, updateTree, deleteTree])

  return createElement(DataContext.Provider, { value }, children)
}

export function useGreenMapData() {
  return useContext(DataContext)
}

export async function submitSurvey(response) {
  if (!supabase) throw new Error('Survey submission is unavailable because Supabase is not configured.')
  const { error } = await supabase.from('survey_responses').insert(response)
  if (error) throw error
  return { localOnly: false }
}
