export interface ParsedNik {
    valid: boolean;
    kodeWilayah: string;
    kodeProvinsi: string;
    kodeKabupaten: string;
    kodeKecamatan: string;
    tanggalLahir: string; // format YYYY-MM-DD untuk <input type="date" />
    jenisKelamin: 'Laki-laki' | 'Perempuan';
}

export function parseNikIndonesia(nikRaw: string): ParsedNik | null {
    const nik = nikRaw.replace(/\D/g, '');
    if (nik.length !== 16) return null;

    const kodeProvinsi = nik.slice(0, 2);
    const kodeKabupaten = nik.slice(0, 4);
    const kodeKecamatan = nik.slice(0, 6);

    let hari = parseInt(nik.slice(6, 8), 10);
    const bulan = parseInt(nik.slice(8, 10), 10);
    const tahunDuaDigit = parseInt(nik.slice(10, 12), 10);

    let jenisKelamin: 'Laki-laki' | 'Perempuan' = 'Laki-laki';
    if (hari > 40) {
        jenisKelamin = 'Perempuan';
        hari -= 40;
    }

    if (hari < 1 || hari > 31 || bulan < 1 || bulan > 12) {
        return null;
    }

    const tahunSekarangDuaDigit = new Date().getFullYear() % 100;
    const tahunPenuh = tahunDuaDigit <= tahunSekarangDuaDigit ? 2000 + tahunDuaDigit : 1900 + tahunDuaDigit;

    const tanggalLahir = `${tahunPenuh}-${String(bulan).padStart(2, '0')}-${String(hari).padStart(2, '0')}`;

    return {
        valid: true,
        kodeWilayah: kodeKecamatan,
        kodeProvinsi,
        kodeKabupaten,
        kodeKecamatan,
        tanggalLahir,
        jenisKelamin,
    };
}