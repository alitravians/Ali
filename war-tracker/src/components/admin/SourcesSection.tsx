import { useState } from 'react';
import { Search } from 'lucide-react';
import { sources } from '../../data/staticConfig';
import { timeAgo, sourceTypeAr } from '../../utils/helpers';
import TrustBadge from '../shared/TrustBadge';
import { SectionHeader } from './AdminUI';

export default function SourcesSection() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div>
      <SectionHeader
        title="مصادر البيانات"
        description="جميع مصادر البيانات المتصلة بالنظام وحالتها"
        action={
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="بحث..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-[#0a0a0f] border border-gray-700 rounded-lg pr-8 pl-3 py-1.5 text-xs text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none w-full sm:w-40"
              />
            </div>
          </div>
        }
      />

      <div className="rounded-xl border border-gray-800 bg-[#12121a] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-800 bg-[#0a0a0f]">
                <th className="text-right py-3 px-4 text-gray-400 font-medium">المصدر</th>
                <th className="text-right py-3 px-4 text-gray-400 font-medium">النوع</th>
                <th className="text-right py-3 px-4 text-gray-400 font-medium">الثقة</th>
                <th className="text-right py-3 px-4 text-gray-400 font-medium">الحالة</th>
                <th className="text-right py-3 px-4 text-gray-400 font-medium">آخر تحديث</th>
                <th className="text-right py-3 px-4 text-gray-400 font-medium">الأخبار</th>
              </tr>
            </thead>
            <tbody>
              {sources
                .filter(s => !searchQuery || s.nameAr.includes(searchQuery) || s.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(source => (
                  <tr key={source.id} className="border-b border-gray-800/50 hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{source.nameAr}</div>
                      <div className="text-[10px] text-gray-600 mt-0.5">{source.name}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-gray-800 rounded-full text-gray-300">{sourceTypeAr(source.type)}</span>
                    </td>
                    <td className="py-3 px-4"><TrustBadge level={source.trustLevel} /></td>
                    <td className="py-3 px-4">
                      <span className={`flex items-center gap-1 ${source.isActive ? 'text-green-400' : 'text-red-400'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${source.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                        {source.isActive ? 'نشط' : 'متوقف'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-400">{timeAgo(source.lastUpdate)}</td>
                    <td className="py-3 px-4 text-white font-semibold">{source.eventCount}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
