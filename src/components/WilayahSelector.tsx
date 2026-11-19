import { useEffect, useMemo, useState } from 'react';
import { MapPin } from 'lucide-react';
import type { SelectOption } from './SearchableSelect';
import SearchableSelect from './SearchableSelect';

export interface WilayahValue {
    provinsi: string;
    kabupaten: string;
    kecamatan: string;
    desa: string;
    kode_pos: string;
    rt: string;
    rw: string;
}

interface WilayahApiItem {
    id: string;
    name: string;
}

interface WilayahSelectorProps {
    value: WilayahValue;
    onChange: (next: WilayahValue) => void;
    showRtRw?: boolean;
    disabled?: boolean;
}

const API_BASE = 'https://www.emsifa.com/api-wilayah-indonesia/api';

function toTitleCase(str: string): string {
    return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function WilayahSelector({
    value,
    onChange,
    showRtRw = true,
    disabled = false,
}: WilayahSelectorProps) {
    const [provinces, setProvinces] = useState<WilayahApiItem[]>([]);
    const [regencies, setRegencies] = useState<WilayahApiItem[]>([]);
    const [districts, setDistricts] = useState<WilayahApiItem[]>([]);
    const [villages, setVillages] = useState<WilayahApiItem[]>([]);

    const [loadingLevel, setLoadingLevel] = useState<'prov' | 'reg' | 'dist' | 'vill' | null>(null);
    const [provId, setProvId] = useState('');
    const [regId, setRegId] = useState('');
    const [distId, setDistId] = useState('');

    useEffect(() => {
        setLoadingLevel('prov');
        fetch(`${API_BASE}/provinces.json`)
            .then((r) => r.json())
            .then((data: WilayahApiItem[]) => {
                setProvinces(data);
                if (value.provinsi) {
                    const match = data.find((p) => p.name.toLowerCase() === value.provinsi.toLowerCase());
                    if (match) setProvId(match.id);
                }
            })
            .catch(() => { })
            .finally(() => setLoadingLevel(null));
    }, []);

    useEffect(() => {
        if (!provId) {
            setRegencies([]);
            return;
        }
        setLoadingLevel('reg');
        fetch(`${API_BASE}/regencies/${provId}.json`)
            .then((r) => r.json())
            .then((data: WilayahApiItem[]) => {
                setRegencies(data);
                if (value.kabupaten) {
                    const match = data.find((r) => r.name.toLowerCase() === value.kabupaten.toLowerCase());
                    if (match) setRegId(match.id);
                }
            })
            .catch(() => { })
            .finally(() => setLoadingLevel(null));
    }, [provId]);

    useEffect(() => {
        if (!regId) {
            setDistricts([]);
            return;
        }
        setLoadingLevel('dist');
        fetch(`${API_BASE}/districts/${regId}.json`)
            .then((r) => r.json())
            .then((data: WilayahApiItem[]) => {
                setDistricts(data);
                if (value.kecamatan) {
                    const match = data.find((d) => d.name.toLowerCase() === value.kecamatan.toLowerCase());
                    if (match) setDistId(match.id);
                }
            })
            .catch(() => { })
            .finally(() => setLoadingLevel(null));
    }, [regId]);

    useEffect(() => {
        if (!distId) {
            setVillages([]);
            return;
        }
        setLoadingLevel('vill');
        fetch(`${API_BASE}/villages/${distId}.json`)
            .then((r) => r.json())
            .then((data: WilayahApiItem[]) => setVillages(data))
            .catch(() => { })
            .finally(() => setLoadingLevel(null));
    }, [distId]);

    const provOptions: SelectOption[] = useMemo(
        () => provinces.map((p) => ({ value: p.id, label: toTitleCase(p.name) })),
        [provinces]
    );
    const regOptions: SelectOption[] = useMemo(
        () => regencies.map((r) => ({ value: r.id, label: toTitleCase(r.name) })),
        [regencies]
    );
    const distOptions: SelectOption[] = useMemo(
        () => districts.map((d) => ({ value: d.id, label: toTitleCase(d.name) })),
        [districts]
    );
    const villOptions: SelectOption[] = useMemo(
        () => villages.map((v) => ({ value: v.id, label: toTitleCase(v.name) })),
        [villages]
    );

    const selectedVillageId =
        villages.find((v) => v.name.toLowerCase() === value.desa.toLowerCase())?.id ?? '';

    const inputClass =
        'w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary disabled:bg-gray-100';

    return (
        <div className="p-4 rounded-2xl bg-gray-50/90 border border-gray-200/80 space-y-3.5">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-text-main">
                    <MapPin size={14} className="text-primary" />
                    <span>Wilayah Administratif & Kode Pos</span>
                </div>
                <span className="text-[11px] text-text-muted">Ketik untuk cari cepat</span>
            </div>

            {/* Baris 1 & 2: Provinsi, Kabupaten/Kota, Kecamatan, Desa/Kelurahan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <SearchableSelect
                    label="Provinsi"
                    value={provId}
                    displayValue={value.provinsi}
                    options={provOptions}
                    placeholder="Pilih Provinsi"
                    searchPlaceholder="Cari provinsi (mis. Jawa Barat)..."
                    loading={loadingLevel === 'prov'}
                    disabled={disabled}
                    onChange={(id, opt) => {
                        setProvId(id);
                        setRegId('');
                        setDistId('');
                        onChange({
                            ...value,
                            provinsi: opt?.label ?? '',
                            kabupaten: '',
                            kecamatan: '',
                            desa: '',
                        });
                    }}
                />

                <SearchableSelect
                    label="Kabupaten / Kota"
                    value={regId}
                    displayValue={value.kabupaten}
                    options={regOptions}
                    placeholder="Pilih Kabupaten / Kota"
                    searchPlaceholder="Cari kabupaten atau kota..."
                    loading={loadingLevel === 'reg'}
                    disabled={disabled || (!provId && regOptions.length === 0)}
                    onChange={(id, opt) => {
                        setRegId(id);
                        setDistId('');
                        onChange({
                            ...value,
                            kabupaten: opt?.label ?? '',
                            kecamatan: '',
                            desa: '',
                        });
                    }}
                />

                <SearchableSelect
                    label="Kecamatan"
                    value={distId}
                    displayValue={value.kecamatan}
                    options={distOptions}
                    placeholder="Pilih Kecamatan"
                    searchPlaceholder="Cari kecamatan..."
                    loading={loadingLevel === 'dist'}
                    disabled={disabled || (!regId && distOptions.length === 0)}
                    onChange={(id, opt) => {
                        setDistId(id);
                        onChange({
                            ...value,
                            kecamatan: opt?.label ?? '',
                            desa: '',
                        });
                    }}
                />

                <SearchableSelect
                    label="Desa / Kelurahan"
                    value={selectedVillageId}
                    displayValue={value.desa}
                    options={villOptions}
                    placeholder="Pilih Desa / Kelurahan"
                    searchPlaceholder="Cari desa atau kelurahan..."
                    loading={loadingLevel === 'vill'}
                    disabled={disabled || (!distId && villOptions.length === 0)}
                    onChange={(_, opt) => {
                        onChange({
                            ...value,
                            desa: opt?.label ?? '',
                        });
                    }}
                />
            </div>

            {/* Baris 3: Kode Pos, RT, dan RW Proporsional */}
            <div className={`grid gap-3.5 ${showRtRw ? 'grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'}`}>
                <div>
                    <label className="block text-xs font-semibold text-text-main mb-1.5">Kode Pos</label>
                    <input
                        type="text"
                        inputMode="numeric"
                        maxLength={5}
                        disabled={disabled}
                        placeholder="17530"
                        value={value.kode_pos}
                        onChange={(e) =>
                            onChange({ ...value, kode_pos: e.target.value.replace(/\D/g, '').slice(0, 5) })
                        }
                        className={inputClass}
                    />
                </div>

                {showRtRw && (
                    <>
                        <div>
                            <label className="block text-xs font-semibold text-text-main mb-1.5">
                                RT <span className="text-[10px] font-normal text-gray-400">(opsional)</span>
                            </label>
                            <input
                                type="text"
                                inputMode="numeric"
                                maxLength={3}
                                disabled={disabled}
                                placeholder="01"
                                value={value.rt}
                                onChange={(e) =>
                                    onChange({ ...value, rt: e.target.value.replace(/\D/g, '').slice(0, 3) })
                                }
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-text-main mb-1.5">
                                RW <span className="text-[10px] font-normal text-gray-400">(opsional)</span>
                            </label>
                            <input
                                type="text"
                                inputMode="numeric"
                                maxLength={3}
                                disabled={disabled}
                                placeholder="08"
                                value={value.rw}
                                onChange={(e) =>
                                    onChange({ ...value, rw: e.target.value.replace(/\D/g, '').slice(0, 3) })
                                }
                                className={inputClass}
                            />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}