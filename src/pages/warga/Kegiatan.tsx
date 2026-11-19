import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock, MapPin } from 'lucide-react';
import { api } from '../../lib/api';
import { formatRp, formatTanggal } from '../../lib/format';

interface KegiatanItem {
  id: number;
  judul: string;
  tanggal: string;
  waktu: string;
  lokasi: string;
  status: string;
  estimasi: number;
}

export default function WargaKegiatan() {
  const [activeTab, setActiveTab] = useState('Semua');
  const [list, setList] = useState<KegiatanItem[]>([]);
  const tabs = ['Semua', 'Planning', 'Berjalan', 'Selesai'];

  useEffect(() => {
    api.get<{ data: KegiatanItem[] }>('/public/kegiatan').then((res) => setList(res.data.data));
  }, []);

  const filteredKegiatan = list.filter((k) => (activeTab === 'Semua' ? true : k.status === activeTab));

  return (
    <div className="p-6 pt-10 min-h-screen bg-bg-gray">
      <h1 className="text-2xl font-bold text-text-main mb-6">Kegiatan Warga</h1>
      <div className="flex gap-2 overflow-x-auto pb-4 mb-2 scrollbar-hide">
        {tabs.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeTab === tab ? 'bg-primary text-white shadow-md' : 'bg-white text-text-muted border border-gray-200 hover:bg-gray-50'}`}>
            {tab}
          </button>
        ))}
      </div>
      <div className="space-y-4">
        {filteredKegiatan.map((kegiatan) => (
          <Link to={`/kegiatan/${kegiatan.id}`} key={kegiatan.id} className="block bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden">
            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${kegiatan.status === 'Planning' ? 'bg-orange-400' : kegiatan.status === 'Berjalan' ? 'bg-primary' : 'bg-gray-400'}`} />
            <div className="flex justify-between items-start mb-3 pl-2">
              <h3 className="font-bold text-text-main text-base leading-tight pr-4">{kegiatan.judul}</h3>
              <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold whitespace-nowrap ${kegiatan.status === 'Planning' ? 'bg-orange-50 text-orange-600' : kegiatan.status === 'Berjalan' ? 'bg-primary-light text-primary' : 'bg-gray-100 text-gray-600'}`}>
                {kegiatan.status}
              </span>
            </div>
            <div className="space-y-1.5 pl-2">
              <div className="flex items-center gap-2 text-xs text-text-muted"><Clock size={14} className="text-gray-400" /><span>{formatTanggal(kegiatan.tanggal)}, {kegiatan.waktu} WIB</span></div>
              <div className="flex items-center gap-2 text-xs text-text-muted"><MapPin size={14} className="text-gray-400" /><span>{kegiatan.lokasi}</span></div>
            </div>
            <div className="mt-4 pl-2 flex justify-between items-center border-t border-gray-50 pt-3">
              <p className="text-xs text-text-muted">Estimasi: <span className="font-semibold text-text-main">{formatRp(kegiatan.estimasi)}</span></p>
              <span className="text-primary text-xs font-semibold flex items-center gap-1">Detail <ArrowRight size={14} /></span>
            </div>
          </Link>
        ))}
        {filteredKegiatan.length === 0 && (
          <div className="text-center py-10 bg-white rounded-2xl border border-gray-100"><p className="text-text-muted text-sm">Belum ada kegiatan.</p></div>
        )}
      </div>
    </div>
  );
}