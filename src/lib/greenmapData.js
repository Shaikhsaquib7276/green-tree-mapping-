import { createClient } from '@supabase/supabase-js'
import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState } from 'react'

export const demoTrees = [
  { id: 'TREE-001', common: 'Rain Tree', scientific: 'Samanea saman', family: 'Fabaceae', zone: 'Central Lawn', condition: 'Healthy', date: '2026-08-18', lat: 19.2818, lng: 73.0484, remark: 'Broad canopy with healthy foliage. Sample record for interface testing.', image: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=900&q=80' },
  { id: 'TREE-002', common: 'Gulmohar', scientific: 'Delonix regia', family: 'Fabaceae', zone: 'East Walkway', condition: 'Fair', date: '2026-08-20', lat: 19.2829, lng: 73.0507, remark: 'Some dry branches observed. Follow-up care recommended.', image: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=900&q=80' },
  { id: 'TREE-003', common: 'Indian Almond', scientific: 'Terminalia catappa', family: 'Combretaceae', zone: 'Library Garden', condition: 'Needs Attention', date: '2026-08-22', lat: 19.2807, lng: 73.0472, remark: 'Soil around base appears compacted. Monitor after rainfall.', image: 'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=900&q=80' },
  { id: 'TREE-004', common: 'Neem', scientific: 'Azadirachta indica', family: 'Meliaceae', zone: 'North Boundary', condition: 'Healthy', date: '2026-08-24', lat: 19.2836, lng: 73.0479, remark: 'Dense foliage and strong trunk. Sample record.', image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=900&q=80' },
  { id: 'TREE-005', common: 'Coconut Palm', scientific: 'Cocos nucifera', family: 'Arecaceae', zone: 'Community Garden', condition: 'Damaged', date: '2026-08-25', lat: 19.2802, lng: 73.0501, remark: 'Leaf damage noted; needs a repeat observation.', image: 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?auto=format&fit=crop&w=900&q=80' },
]
export const demoSpaces = [
  { name: 'Central Learning Lawn', type: 'Lawn', location: 'Central Lawn', area: '1,240 m²', condition: 'Good', description: 'Open lawn used for informal learning, community gatherings and shade from surrounding trees.' },
  { name: 'Library Garden', type: 'Garden', location: 'Library Garden', area: '380 m²', condition: 'Needs care', description: 'A quiet planted edge beside the library with native and ornamental species.' },
  { name: 'Community Food Patch', type: 'Community garden', location: 'South Courtyard', area: '210 m²', condition: 'Developing', description: 'A small shared plot being documented for future community stewardship.' },
]
export const demoGallery = [
  ['Trees in context', 'Trees', 'Central Lawn', 'https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=900&q=80'],
  ['A shared garden edge', 'Green Spaces', 'Library Garden', 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=900&q=80'],
  ['A field note in progress', 'Survey Activities', 'Campus Environment', 'https://images.unsplash.com/photo-1599685315640-98c1b6f8f3a4?auto=format&fit=crop&w=900&q=80'],
  ['Light through the canopy', 'Campus Environment', 'East Walkway', 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=900&q=80'],
  ['A place to pause', 'Community Awareness', 'Central Lawn', 'https://images.unsplash.com/photo-1473445361085-b9a07f55608b?auto=format&fit=crop&w=900&q=80'],
  ['Green cover, recorded', 'Trees', 'North Boundary', 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=900&q=80'],
]

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY
export const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null

const mapTree = (row) => ({ id: row.tree_id, common: row.common_name, scientific: row.scientific_name, family: row.family, zone: row.location_zone, condition: row.condition, date: row.date_surveyed, lat: row.latitude, lng: row.longitude, remark: row.remarks, image: row.photo_url, isDemo: row.is_demo })
const mapSpace = (row) => ({ name: row.name, type: row.space_type, location: row.location, area: row.area ? `${Number(row.area).toLocaleString()} m²` : 'Area not recorded', condition: row.condition, description: row.description, lat: row.latitude, lng: row.longitude, image: row.photo_url, isDemo: row.is_demo })
const mapGallery = (row) => [row.title, row.category, row.location || 'Location not recorded', row.image_url, row.date_taken]

const DataContext = createContext(null)
export function GreenMapProvider({ children }) {
  const [data, setData] = useState({ trees: demoTrees, spaces: demoSpaces, gallery: demoGallery, surveyCount: 0, loading: Boolean(supabase), connected: Boolean(supabase), error: null })
  const [refreshKey, setRefreshKey] = useState(0)
  const refresh = useCallback(() => setRefreshKey((value) => value + 1), [])
  const createTree = useCallback(async (tree) => {
    if (supabase) {
      const { error } = await supabase.from('trees').insert({ tree_id: tree.id, common_name: tree.common, scientific_name: tree.scientific, family: tree.family, location_zone: tree.zone, latitude: tree.lat, longitude: tree.lng, condition: tree.condition, date_surveyed: tree.date || null, remarks: tree.remark, photo_url: tree.image || null, is_demo: false })
      if (error) throw error
      refresh()
      return
    }
    setData((current) => ({ ...current, trees: [...current.trees, { ...tree, isDemo: false }] }))
  }, [refresh])
  const updateTree = useCallback(async (tree) => {
    if (supabase) {
      const { error } = await supabase.from('trees').update({ common_name: tree.common, scientific_name: tree.scientific, family: tree.family, location_zone: tree.zone, latitude: tree.lat, longitude: tree.lng, condition: tree.condition, date_surveyed: tree.date || null, remarks: tree.remark, photo_url: tree.image || null, updated_at: new Date().toISOString() }).eq('tree_id', tree.id)
      if (error) throw error
      refresh()
      return
    }
    setData((current) => ({ ...current, trees: current.trees.map((item) => item.id === tree.id ? { ...item, ...tree, isDemo: false } : item) }))
  }, [refresh])
  const deleteTree = useCallback(async (treeId) => {
    if (supabase) {
      const { error } = await supabase.from('trees').delete().eq('tree_id', treeId)
      if (error) throw error
      refresh()
      return
    }
    setData((current) => ({ ...current, trees: current.trees.filter((item) => item.id !== treeId) }))
  }, [refresh])
  useEffect(() => {
    if (!supabase) return
    let active = true
    const load = async () => {
      const [treeResult, spaceResult, galleryResult, surveyResult] = await Promise.all([
        supabase.from('trees').select('*').order('tree_id'),
        supabase.from('green_spaces').select('*').order('name'),
        supabase.from('gallery').select('*').order('created_at', { ascending: false }),
        supabase.rpc('get_survey_response_count'),
      ])
      const firstError = treeResult.error || spaceResult.error || galleryResult.error || surveyResult.error
      if (!active) return
      if (firstError) {
        setData((current) => ({ ...current, loading: false, error: firstError.message }))
        return
      }
      setData({ trees: (treeResult.data || []).map(mapTree), spaces: (spaceResult.data || []).map(mapSpace), gallery: (galleryResult.data || []).map(mapGallery), surveyCount: Number(surveyResult.data || 0), loading: false, connected: true, error: null })
    }
    load()
    return () => { active = false }
  }, [refreshKey])
  const value = useMemo(() => ({ ...data, refresh, createTree, updateTree, deleteTree, demoMode: !supabase || Boolean(data.error) }), [data, refresh, createTree, updateTree, deleteTree])
  return createElement(DataContext.Provider, { value }, children)
}
export function useGreenMapData() {
  return useContext(DataContext)
}
export async function submitSurvey(response) {
  if (!supabase) return { localOnly: true }
  const { error } = await supabase.from('survey_responses').insert(response)
  if (error) throw error
  return { localOnly: false }
}
