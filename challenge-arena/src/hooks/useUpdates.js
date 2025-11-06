import { useState, useEffect } from 'react'
import { ref, onValue } from 'firebase/database'
import { database } from '../utils/firebase'

export function useUpdates() {
  const [items, setItems] = useState([])

  useEffect(() => {
    const updatesRef = ref(database, 'updates')
    
    const unsubscribe = onValue(updatesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val()
        const mapped = Object.entries(data).map(([id, value]) => {
          return mapFirebaseUpdateToItem(id, value)
        })
        setItems(mapped)
      } else {
        setItems([])
      }
    })

    return () => unsubscribe()
  }, [])

  return items
}

function mapFirebaseUpdateToItem(id, update) {
  const textAr = update.textAr || ''
  const textEn = update.textEn || ''
  
  const lines = textAr.split('\n').filter(line => line.trim())
  const title = lines[0] || 'تحديث'
  const summary = lines.slice(1).join(' ').substring(0, 150) || textEn.substring(0, 150) || 'تحديث جديد'
  
  const type = detectType(textAr + ' ' + textEn)
  
  const tags = extractTags(textAr + ' ' + textEn)
  
  return {
    id,
    title: title.replace(/[*#]/g, '').trim(),
    summary: summary.replace(/[*#]/g, '').trim(),
    date: update.date || new Date(update.createdAt).toISOString().split('T')[0],
    type,
    tags
  }
}

function detectType(text) {
  const lower = text.toLowerCase()
  
  if (lower.includes('إضافة') || lower.includes('ميزة') || lower.includes('added') || lower.includes('feature') || lower.includes('✨')) {
    return 'feature'
  }
  
  if (lower.includes('إصلاح') || lower.includes('fix') || lower.includes('🐛') || lower.includes('fixed')) {
    return 'fix'
  }
  
  if (lower.includes('تحسين') || lower.includes('improvement') || lower.includes('improve') || lower.includes('⚡') || lower.includes('♻️')) {
    return 'improvement'
  }
  
  return 'other'
}

function extractTags(text) {
  const tags = []
  const lower = text.toLowerCase()
  
  if (lower.includes('ui') || lower.includes('واجهة')) tags.push('UI')
  if (lower.includes('admin') || lower.includes('إدارة') || lower.includes('لوحة التحكم')) tags.push('Admin')
  if (lower.includes('performance') || lower.includes('أداء')) tags.push('Performance')
  if (lower.includes('loading') || lower.includes('تحميل')) tags.push('Loading')
  if (lower.includes('pwa')) tags.push('PWA')
  if (lower.includes('seo')) tags.push('SEO')
  if (lower.includes('firebase') || lower.includes('database')) tags.push('Database')
  if (lower.includes('navbar') || lower.includes('navigation') || lower.includes('تنقل')) tags.push('Navigation')
  if (lower.includes('changelog') || lower.includes('تحديثات')) tags.push('Updates')
  
  return tags.slice(0, 3)
}
