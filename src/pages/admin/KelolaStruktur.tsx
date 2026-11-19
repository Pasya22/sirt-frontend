import { useCallback, useEffect, useRef, useState } from 'react';
import { Edit2, GripHorizontal, Loader2, Move, Plus, Save, Trash2 } from 'lucide-react';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import Toast from '../../components/Toast';
import InfoAkses from '../../components/InfoAkses';
import { useAkses } from '../../lib/akses';
import { api, getErrorMessage } from '../../lib/api';

type KelompokStruktur = 'inti' | 'seksi';

interface StrukturNode {
  id: string;
  kelompok: KelompokStruktur;
  jabatan: string;
  nama: string;
  inisial: string;
  color: string;
  x: number;
  y: number;
  parentId: string | null;
}

const LEBAR_KARTU = 192;
const TINGGI_KARTU = 112;

const WARNA_OPTIONS = [
  { value: 'bg-primary', label: 'Hijau Utama' },
  { value: 'bg-emerald-600', label: 'Emerald' },
  { value: 'bg-blue-600', label: 'Biru' },
  { value: 'bg-orange-500', label: 'Oranye' },
  { value: 'bg-purple-600', label: 'Ungu' },
  { value: 'bg-slate-700', label: 'Abu Gelap (Seksi)' },
];

export default function AdminKelolaStruktur() {
  const { can } = useAkses();
  const bisaEdit = can('organisasi', 'edit');
  const bisaHapus = can('organisasi', 'hapus');

  const canvasRef = useRef<HTMLDivElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<StrukturNode | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [toast, setToast] = useState({ isOpen: false, message: '' });
  const [nodes, setNodes] = useState<StrukturNode[]>([]);
  const [wargaOptions, setWargaOptions] = useState<string[]>([]);

  const fetchStruktur = useCallback(async () => {
    const [resStruktur, resWarga] = await Promise.all([
      api.get<{ data: StrukturNode[] }>('/admin/struktur'),
      api.get<{ data: { nama: string }[] }>('/admin/warga'),
    ]);
    setNodes(resStruktur.data.data);
    setWargaOptions(resWarga.data.data.map((w) => w.nama));
  }, []);

  useEffect(() => {
    fetchStruktur();
  }, [fetchStruktur]);

  const showToast = (message: string) => setToast({ isOpen: true, message });

  const openCreateModal = () => {
    if (!bisaEdit) return;
    setEditingNode(null);
    setIsModalOpen(true);
  };

  const openEditModal = (node: StrukturNode) => {
    if (!bisaEdit) return;
    setEditingNode(node);
    setIsModalOpen(true);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>, id: string) => {
    if (!bisaEdit || !canvasRef.current) return;
    const node = nodes.find((n) => n.id === id);
    if (!node) return;
    const rect = canvasRef.current.getBoundingClientRect();
    e.currentTarget.setPointerCapture(e.pointerId);
    setDraggingId(id);
    setDragOffset({ x: e.clientX - rect.left - node.x, y: e.clientY - rect.top - node.y });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!bisaEdit || !draggingId || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.round(Math.max(0, Math.min(e.clientX - rect.left - dragOffset.x, rect.width - LEBAR_KARTU)));
    const y = Math.round(Math.max(0, Math.min(e.clientY - rect.top - dragOffset.y, rect.height - TINGGI_KARTU)));
    setNodes((prev) => prev.map((n) => (n.id === draggingId ? { ...n, x, y } : n)));
  };

  const handleSaveLayout = async () => {
    if (!bisaEdit) return;
    setIsSaving(true);
    try {
      const res = await api.put<{ message: string }>('/admin/struktur/layout', {
        nodes: nodes.map((n) => ({ id: Number(n.id), x: n.x, y: n.y })),
      });
      showToast(res.data.message);
    } catch (err) {
      showToast(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitNode = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!bisaEdit) return;

    const fd = new FormData(e.currentTarget);
    const jabatan = String(fd.get('jabatan')).trim();
    const nama = String(fd.get('nama')).trim();
    const kelompok = (fd.get('kelompok') as KelompokStruktur) || 'seksi';
    const parentRaw = String(fd.get('parentId') || '');
    const parentId = parentRaw ? Number(parentRaw) : null;
    const color = String(fd.get('color') || (kelompok === 'inti' ? 'bg-primary' : 'bg-slate-700'));

    if (!jabatan || !nama) return;

    setIsSubmitting(true);
    try {
      if (editingNode) {
        const res = await api.put<{ message: string }>(`/admin/struktur/${editingNode.id}`, {
          jabatan,
          nama,
          kelompok,
          parentId,
          color,
        });
        showToast(res.data.message);
      } else {
        const res = await api.post<{ message: string }>('/admin/struktur', {
          jabatan,
          nama,
          kelompok,
          parentId,
          color,
          x: 40 + (nodes.length % 5) * 40,
          y: kelompok === 'inti' ? 200 : 360,
        });
        showToast(res.data.message);
      }
      await fetchStruktur();
      setIsModalOpen(false);
    } catch (err) {
      showToast(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!bisaHapus || deleteId === null) return;
    await api.delete(`/admin/struktur/${deleteId}`);
    await fetchStruktur();
    showToast('Jabatan dihapus.');
  };

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  return (
    <div className="space-y-6 h-[calc(100vh-140px)] flex flex-col">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col md:flex-row justify-between md:items-center gap-4 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-text-main">{bisaEdit ? 'Atur Layout Struktur' : 'Struktur Organisasi'}</h2>
          <p className="text-sm text-text-muted mt-1">
            {bisaEdit ? 'Klik ikon pensil untuk edit pengurus, geser kartu untuk atur urutan, lalu Simpan Layout.' : 'Bagan kepengurusan RT 01 / RW 08.'}
          </p>
        </div>
        {bisaEdit && (
          <div className="flex items-center gap-3">
            <button type="button" onClick={openCreateModal} className="bg-white border border-gray-300 text-text-main hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 min-h-[44px]">
              <Plus size={16} /> Tambah
            </button>
            <button type="button" onClick={handleSaveLayout} disabled={isSaving} className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm disabled:opacity-70 min-h-[44px]">
              {isSaving ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : <Save size={16} />}
              {isSaving ? 'Menyimpan...' : 'Simpan Layout'}
            </button>
          </div>
        )}
      </div>

      <InfoAkses tampil={!bisaEdit && !bisaHapus} />

      <div
        ref={canvasRef}
        onPointerMove={handlePointerMove}
        onPointerUp={() => setDraggingId(null)}
        onPointerCancel={() => setDraggingId(null)}
        className="flex-1 bg-gray-50 border-2 border-dashed border-gray-300 rounded-2xl relative overflow-auto select-none"
        style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '20px 20px' }}
      >
        <svg className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true">
          {nodes.map((node) => {
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

        {nodes.map((node) => (
          <div
            key={node.id}
            onPointerDown={(e) => handlePointerDown(e, node.id)}
            style={{ left: `${node.x}px`, top: `${node.y}px`, touchAction: bisaEdit ? 'none' : 'auto' }}
            className={`absolute w-48 bg-white p-4 rounded-xl shadow-md border-2 flex flex-col items-center text-center transition-shadow hover:shadow-lg ${bisaEdit ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'} ${draggingId === node.id ? 'border-primary ring-2 ring-primary/20 z-50' : 'border-gray-200 z-10'}`}
          >
            {bisaEdit && (
              <>
                <div className="absolute top-1 left-1/2 -translate-x-1/2 text-gray-300"><GripHorizontal size={16} /></div>
                <button
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => openEditModal(node)}
                  title="Edit Pengurus"
                  className="absolute top-2 left-2 text-gray-400 hover:text-primary p-1 rounded"
                >
                  <Edit2 size={14} />
                </button>
              </>
            )}
            {bisaHapus && (
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => setDeleteId(node.id)}
                title="Hapus Jabatan"
                className="absolute top-2 right-2 text-gray-400 hover:text-red-500 p-1 rounded"
              >
                <Trash2 size={14} />
              </button>
            )}
            <div className={`w-14 h-14 ${node.color} rounded-full flex items-center justify-center text-white font-bold text-lg mb-2.5 shadow-sm pointer-events-none`}>
              {node.inisial}
            </div>
            <span className="text-[10px] uppercase tracking-wider font-semibold text-primary/80 mb-0.5 pointer-events-none">
              {node.kelompok === 'inti' ? 'Pengurus Inti' : 'Seksi'}
            </span>
            <p className="font-bold text-text-main text-sm pointer-events-none">{node.jabatan}</p>
            <p className="text-xs text-text-muted mt-0.5 truncate w-full pointer-events-none">{node.nama}</p>
          </div>
        ))}

        {bisaEdit && (
          <div className="absolute bottom-4 right-4 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-gray-200 text-xs text-text-muted flex items-center gap-2 pointer-events-none">
            <Move size={14} /> Tahan & Geser kartu
          </div>
        )}
      </div>

      <Modal
        isOpen={bisaEdit && isModalOpen}
        onClose={() => !isSubmitting && setIsModalOpen(false)}
        title={editingNode ? 'Edit Pengurus & Jabatan' : 'Tambah Jabatan Baru'}
      >
        <form key={editingNode?.id ?? 'baru'} className="space-y-4" onSubmit={handleSubmitNode}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="kelompok" className="block text-sm font-medium text-text-main mb-1">Kelompok</label>
              <select
                id="kelompok"
                name="kelompok"
                defaultValue={editingNode?.kelompok ?? 'seksi'}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white"
              >
                <option value="inti">Pengurus Inti</option>
                <option value="seksi">Seksi-seksi</option>
              </select>
            </div>
            <div>
              <label htmlFor="color" className="block text-sm font-medium text-text-main mb-1">Warna Avatar</label>
              <select
                id="color"
                name="color"
                defaultValue={editingNode?.color ?? 'bg-primary'}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white"
              >
                {WARNA_OPTIONS.map((w) => (
                  <option key={w.value} value={w.value}>{w.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="jabatan" className="block text-sm font-medium text-text-main mb-1">Nama Jabatan</label>
            <input
              id="jabatan"
              name="jabatan"
              type="text"
              required
              defaultValue={editingNode?.jabatan ?? ''}
              placeholder="Contoh: Ketua RT / Seksi Pemuda"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm"
            />
          </div>

          <div>
            <label htmlFor="nama" className="block text-sm font-medium text-text-main mb-1">Nama Pengurus (Warga)</label>
            <input
              id="nama"
              name="nama"
              list="daftar-warga-struktur"
              type="text"
              required
              defaultValue={editingNode?.nama ?? ''}
              placeholder="Pilih atau ketik nama warga..."
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm"
            />
            <datalist id="daftar-warga-struktur">
              {wargaOptions.map((w) => (
                <option key={w} value={w} />
              ))}
            </datalist>
          </div>

          <div>
            <label htmlFor="parentId" className="block text-sm font-medium text-text-main mb-1">Garis Penghubung ke Atasan (Opsional)</label>
            <select
              id="parentId"
              name="parentId"
              defaultValue={editingNode?.parentId ?? ''}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm bg-white"
            >
              <option value="">-- Tidak ada (Posisi Puncak / Mandiri) --</option>
              {nodes
                .filter((n) => n.id !== editingNode?.id)
                .map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.jabatan} ({n.nama})
                  </option>
                ))}
            </select>
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t border-gray-100">
            <button type="button" onClick={() => setIsModalOpen(false)} disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-text-muted hover:bg-gray-100 rounded-lg">
              Batal
            </button>
            <button type="submit" disabled={isSubmitting} className="px-6 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg shadow-sm flex items-center gap-2">
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              {isSubmitting ? 'Menyimpan...' : editingNode ? 'Simpan Perubahan' : 'Tambahkan'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={bisaHapus && deleteId !== null} onClose={() => setDeleteId(null)} onConfirm={handleDelete} message="Jabatan ini akan dihapus dari bagan." />
      <Toast isOpen={toast.isOpen} onClose={() => setToast((t) => ({ ...t, isOpen: false }))} message={toast.message} />
    </div>
  );
}