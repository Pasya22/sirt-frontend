import { useEffect, useState } from 'react';
import { GitFork, LayoutGrid } from 'lucide-react';
import { ContentLoader } from '../../components/LoadingScreen';
import { api } from '../../lib/api';

interface PengurusItem {
  id: string;
  kelompok: 'inti' | 'seksi';
  jabatan: string;
  nama: string;
  inisial: string;
  color: string;
  x: number;
  y: number;
  parentId: string | null;
}

// Samakan persis dengan ukuran kartu di KelolaStruktur.tsx agar koordinat & garis identik
const LEBAR_KARTU = 192;
const TINGGI_KARTU = 112;

/**
 * Mengelompokkan kartu ke dalam baris berdasarkan kedekatan posisi Y (atas-bawah),
 * lalu mengurutkan tiap baris dari kiri ke kanan berdasarkan posisi X,
 * tanpa mengubah nilai koordinat asli.
 */
function kelompokkanPerBaris(nodes: PengurusItem[]): PengurusItem[][] {
  if (nodes.length === 0) return [];

  const urutAtasBawah = [...nodes].sort((a, b) => a.y - b.y || a.x - b.x);
  const barisList: PengurusItem[][] = [];

  for (const node of urutAtasBawah) {
    const barisTerakhir = barisList[barisList.length - 1];
    if (!barisTerakhir) {
      barisList.push([node]);
      continue;
    }

    const rataY = barisTerakhir.reduce((total, item) => total + item.y, 0) / barisTerakhir.length;
    if (Math.abs(node.y - rataY) <= 65) {
      barisTerakhir.push(node);
    } else {
      barisList.push([node]);
    }
  }

  return barisList.map((baris) => baris.sort((a, b) => a.x - b.x));
}

export default function WargaOrganisasi() {
  const [allNodes, setAllNodes] = useState<PengurusItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'kartu' | 'bagan'>('kartu');

  useEffect(() => {
    api
      .get<{
        pengurusInti: PengurusItem[];
        seksiSeksi: PengurusItem[];
        allNodes?: PengurusItem[];
      }>('/public/organisasi')
      .then((res) => {
        const gabungan = res.data.allNodes ?? [
          ...(res.data.pengurusInti ?? []),
          ...(res.data.seksiSeksi ?? []),
        ];
        setAllNodes(gabungan);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <ContentLoader />;
  }

  const barisStruktur = kelompokkanPerBaris(allNodes);

  // Dimensi canvas mengikuti koordinat asli dari pengurus
  const maxX = Math.max(380, ...allNodes.map((n) => n.x + LEBAR_KARTU + 32));
  const maxY = Math.max(440, ...allNodes.map((n) => n.y + TINGGI_KARTU + 32));
  const nodeMap = new Map(allNodes.map((n) => [n.id, n]));

  return (
    <div className="p-6 pt-10 min-h-screen bg-bg-gray pb-24">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-text-main mb-1">Struktur Organisasi</h1>
        <p className="text-sm text-text-muted">RT 01 / RW 08 • Periode 2025 - 2028</p>
      </div>

      {/* Switcher Tampilan Kartu vs Bagan Canvas */}
      <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm mb-8 max-w-xs mx-auto">
        <button
          type="button"
          onClick={() => setMode('kartu')}
          className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
            mode === 'kartu' ? 'bg-primary text-white shadow-sm' : 'text-text-muted hover:text-text-main'
          }`}
        >
          <LayoutGrid size={14} /> Susunan Kartu
        </button>
        <button
          type="button"
          onClick={() => setMode('bagan')}
          className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
            mode === 'bagan' ? 'bg-primary text-white shadow-sm' : 'text-text-muted hover:text-text-main'
          }`}
        >
          <GitFork size={14} /> Bagan Visual
        </button>
      </div>

      {allNodes.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 text-sm text-text-muted">
          Data struktur organisasi belum diatur oleh pengurus.
        </div>
      ) : mode === 'kartu' ? (
        /* Susunan Kartu mengikuti posisi baris (Y) dan urutan kiri-kanan (X) */
        <div className="flex flex-col items-center">
          {barisStruktur.map((baris, idxBaris) => {
            const jumlah = baris.length;
            const ukuranKartu =
              jumlah === 1
                ? 'w-52 p-4'
                : jumlah === 2
                  ? 'w-[calc(50%-0.375rem)] p-3.5'
                  : 'w-[calc(33.333%-0.5rem)] p-3';

            return (
              <div key={idxBaris} className="w-full flex flex-col items-center">
                <div className="w-full flex flex-wrap justify-center gap-3">
                  {baris.map((item) => (
                    <div
                      key={item.id}
                      className={`${ukuranKartu} bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center`}
                    >
                      <div
                        className={`${
                          jumlah >= 3 ? 'w-11 h-11 text-xs mb-2' : 'w-14 h-14 text-base mb-2.5'
                        } ${item.color} rounded-full flex items-center justify-center text-white font-bold shadow-sm`}
                      >
                        {item.inisial}
                      </div>
                      <p
                        className={`font-bold text-text-main leading-tight ${
                          jumlah >= 3 ? 'text-xs mb-1' : 'text-sm mb-1'
                        }`}
                      >
                        {item.jabatan}
                      </p>
                      <p
                        className={`text-text-muted truncate w-full ${
                          jumlah >= 3 ? 'text-[10px]' : 'text-xs'
                        }`}
                      >
                        {item.nama}
                      </p>
                    </div>
                  ))}
                </div>

                {idxBaris < barisStruktur.length - 1 && (
                  <div className="w-0.5 h-6 bg-gray-300 my-1" />
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Bagan Visual: Koordinat (x, y) & ukuran kartu identik 1:1 dengan panel pengurus */
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-auto">
          <div
            className="relative"
            style={{
              width: `${maxX}px`,
              height: `${maxY}px`,
              backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          >
            <svg className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true">
              {allNodes.map((node) => {
                if (!node.parentId) return null;
                const parent = nodeMap.get(node.parentId);
                if (!parent) return null;
                return (
                  <line
                    key={node.id}
                    x1={parent.x + LEBAR_KARTU / 2}
                    y1={parent.y + TINGGI_KARTU}
                    x2={node.x + LEBAR_KARTU / 2}
                    y2={node.y}
                    stroke="#94a3b8"
                    strokeWidth="2"
                    strokeDasharray="4"
                  />
                );
              })}
            </svg>

            {allNodes.map((node) => (
              <div
                key={node.id}
                style={{ left: `${node.x}px`, top: `${node.y}px` }}
                className="absolute w-48 bg-white p-4 rounded-xl shadow-md border-2 border-gray-200 flex flex-col items-center text-center"
              >
                <div className={`w-14 h-14 ${node.color} rounded-full flex items-center justify-center text-white font-bold text-lg mb-2.5 shadow-sm`}>
                  {node.inisial}
                </div>
                <span className="text-[10px] uppercase tracking-wider font-semibold text-primary/80 mb-0.5">
                  {node.kelompok === 'inti' ? 'Pengurus Inti' : 'Seksi'}
                </span>
                <p className="font-bold text-text-main text-sm">{node.jabatan}</p>
                <p className="text-xs text-text-muted mt-0.5 truncate w-full">{node.nama}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}