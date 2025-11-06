import { useMemo, useState } from 'react'

export default function UpdatesSection({ items = [] }){
  const [filter, setFilter] = useState('all')

  const list = useMemo(()=> {
    const sorted = [...items].sort((a,b)=> new Date(b.date) - new Date(a.date))
    if(filter==='all') return sorted
    return sorted.filter(x=> x.type === filter)
  }, [items, filter])

  const countByType = useMemo(()=> ({
    all: items.length,
    feature: items.filter(x=>x.type==='feature').length,
    improvement: items.filter(x=>x.type==='improvement').length,
    fix: items.filter(x=>x.type==='fix').length,
  }), [items])

  const typeLabel = (t)=> t==='feature' ? 'ميزة' : t==='improvement' ? 'تحسين' : t==='fix' ? 'إصلاح' : 'أخرى'
  const typeColor = (t)=> t==='feature' ? 'bg-emerald-600/15 text-emerald-600 ring-emerald-500/20'
                          : t==='improvement' ? 'bg-sky-600/15 text-sky-600 ring-sky-500/20'
                          : t==='fix' ? 'bg-amber-600/15 text-amber-600 ring-amber-500/20'
                          : 'bg-slate-600/15 text-slate-600 ring-slate-500/20'

  if (items.length === 0) {
    return (
      <section className="bg-white rounded-3xl shadow-xl p-8 border border-slate-200">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">جديدنا</h2>
        <p className="text-slate-600 text-center py-8">لا توجد تحديثات حالياً</p>
      </section>
    )
  }

  const hasTypes = items.some(x => x.type && x.type !== 'other')

  return (
    <section className="bg-white rounded-3xl shadow-xl p-8 border border-slate-200">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <h2 className="text-2xl font-bold text-slate-900">جديدنا</h2>

        {hasTypes && (
          <div className="flex items-center gap-2 text-sm flex-wrap">
            <button onClick={()=>setFilter('all')} className={btnClass(filter==='all')}>الكل ({countByType.all})</button>
            {countByType.feature > 0 && <button onClick={()=>setFilter('feature')} className={btnClass(filter==='feature')}>ميزات ({countByType.feature})</button>}
            {countByType.improvement > 0 && <button onClick={()=>setFilter('improvement')} className={btnClass(filter==='improvement')}>تحسينات ({countByType.improvement})</button>}
            {countByType.fix > 0 && <button onClick={()=>setFilter('fix')} className={btnClass(filter==='fix')}>إصلاحات ({countByType.fix})</button>}
          </div>
        )}
      </div>

      <ol className="relative border-s border-slate-300 ms-4 space-y-5">
        {list.map(item => (
          <li key={item.id} className="ms-6">
            <span className="absolute -start-3 mt-2 flex h-6 w-6 items-center justify-center rounded-full ring-8 ring-white bg-slate-300">
              {iconFor(item.type)}
            </span>
            <div className="rounded-xl border border-slate-200 p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {item.type && item.type !== 'other' && (
                    <span className={"inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 " + typeColor(item.type)}>
                      {typeLabel(item.type)}
                    </span>
                  )}
                  <span className="text-sm text-slate-600">{formatDate(item.date)}</span>
                </div>
              </div>
              <h3 className="mt-2 text-base font-bold leading-6 text-slate-900">{item.title}</h3>
              <p className="mt-1 text-sm text-slate-700">{item.summary}</p>
              {item.tags?.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {item.tags.map(tag => (
                    <span key={tag} className="text-xs px-2 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700">{tag}</span>
                  ))}
                </div>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

function btnClass(active){
  return "px-3 py-1 rounded-lg border text-slate-700 transition-all "
    + (active ? "bg-slate-900 text-white border-slate-900"
              : "border-slate-300 hover:bg-slate-100")
}

function iconFor(type){
  const cls = "h-3 w-3 rounded-full"
  if(type==='feature') return <span className={cls + " bg-emerald-500"} />
  if(type==='improvement') return <span className={cls + " bg-sky-500"} />
  if(type==='fix') return <span className={cls + " bg-amber-500"} />
  return <span className={cls + " bg-slate-400"} />
}

function formatDate(dateStr) {
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })
  } catch {
    return dateStr
  }
}
