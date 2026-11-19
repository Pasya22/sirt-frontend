import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Loader2, Search, X } from 'lucide-react';

export interface SelectOption {
    value: string;
    label: string;
    sublabel?: string;
}

interface SearchableSelectProps {
    label: string;
    value: string;
    displayValue?: string;
    options: SelectOption[];
    placeholder?: string;
    searchPlaceholder?: string;
    disabled?: boolean;
    loading?: boolean;
    onChange: (value: string, option?: SelectOption) => void;
}

export default function SearchableSelect({
    label,
    value,
    displayValue,
    options,
    placeholder = 'Pilih opsi...',
    searchPlaceholder = 'Ketik untuk mencari...',
    disabled = false,
    loading = false,
    onChange,
}: SearchableSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const selectedOption = useMemo(
        () => options.find((opt) => opt.value === value),
        [options, value]
    );

    const shownLabel = selectedOption?.label || displayValue || '';

    const filteredOptions = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return options;
        return options.filter(
            (opt) =>
                opt.label.toLowerCase().includes(q) ||
                (opt.sublabel && opt.sublabel.toLowerCase().includes(q))
        );
    }, [options, query]);

    useEffect(() => {
        if (!isOpen) return;
        const handleOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
                setQuery('');
            }
        };
        document.addEventListener('mousedown', handleOutside);
        return () => document.removeEventListener('mousedown', handleOutside);
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 40);
        }
    }, [isOpen]);

    return (
        <div ref={containerRef} className="relative">
            <label className="block text-xs font-semibold text-text-main mb-1.5">{label}</label>

            <button
                type="button"
                disabled={disabled}
                onClick={() => !disabled && setIsOpen((prev) => !prev)}
                className={`w-full min-h-[42px] px-3.5 py-2 rounded-xl border text-left text-sm flex items-center justify-between gap-2 transition-all ${disabled
                        ? 'bg-gray-100/80 border-gray-200 text-gray-400 cursor-not-allowed'
                        : isOpen
                            ? 'bg-white border-primary ring-2 ring-primary/15 text-text-main'
                            : 'bg-white border-gray-200 hover:border-gray-300 text-text-main'
                    }`}
            >
                <span className={`truncate ${shownLabel ? 'font-medium text-text-main' : 'text-gray-400'}`}>
                    {shownLabel || placeholder}
                </span>

                <div className="flex items-center gap-1 shrink-0">
                    {loading && <Loader2 size={14} className="animate-spin text-primary" />}
                    {!disabled && shownLabel && !loading && (
                        <span
                            role="button"
                            tabIndex={-1}
                            onClick={(e) => {
                                e.stopPropagation();
                                onChange('', undefined);
                                setQuery('');
                            }}
                            className="p-0.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                            title="Hapus pilihan"
                        >
                            <X size={13} />
                        </span>
                    )}
                    <ChevronDown
                        size={16}
                        className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-primary' : ''}`}
                    />
                </div>
            </button>

            {isOpen && !disabled && (
                <div className="absolute left-0 right-0 mt-1.5 bg-white rounded-xl border border-gray-200 shadow-xl z-50 overflow-hidden">
                    <div className="p-2 border-b border-gray-100 bg-gray-50/70">
                        <div className="relative">
                            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder={searchPlaceholder}
                                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                            />
                        </div>
                    </div>

                    <ul className="max-h-52 overflow-y-auto py-1 divide-y divide-gray-50">
                        {filteredOptions.length === 0 ? (
                            <li className="px-3.5 py-4 text-xs text-center text-text-muted">
                                {loading ? 'Memuat daftar wilayah...' : 'Wilayah tidak ditemukan'}
                            </li>
                        ) : (
                            filteredOptions.map((opt) => {
                                const isSelected = opt.value === value || opt.label === shownLabel;
                                return (
                                    <li key={opt.value}>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                onChange(opt.value, opt);
                                                setIsOpen(false);
                                                setQuery('');
                                            }}
                                            className={`w-full px-3.5 py-2 text-left text-xs flex items-center justify-between gap-2 transition-colors ${isSelected
                                                    ? 'bg-primary-light/70 text-primary font-semibold'
                                                    : 'text-text-main hover:bg-gray-50'
                                                }`}
                                        >
                                            <span className="truncate">{opt.label}</span>
                                            {isSelected && <Check size={14} className="text-primary shrink-0" />}
                                        </button>
                                    </li>
                                );
                            })
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
}