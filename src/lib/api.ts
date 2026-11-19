
import axios, { AxiosError } from 'axios';

export const TOKEN_KEY = 'sirt.token';

// Otomatis mengikuti hostname React yang sedang diakses.
const getApiBaseUrl = () => {
    const envUrl = import.meta.env.VITE_API_URL;

    if (envUrl) {
        return envUrl;
    }

    return `${window.location.protocol}//${window.location.hostname}:8000/api/v1`;
};

export const api = axios.create({
    baseURL: getApiBaseUrl(),
    headers: {
        Accept: 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = sessionStorage.getItem(TOKEN_KEY);

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error: AxiosError<{ message?: string }>) => {
        if (
            error.response?.status === 401 &&
            !error.config?.url?.includes('/auth/login')
        ) {
            sessionStorage.removeItem(TOKEN_KEY);
            window.dispatchEvent(new Event('sirt:unauthorized'));
        }

        return Promise.reject(error);
    },
);

export function getErrorMessage(
    err: unknown,
    fallback = 'Terjadi kesalahan pada server.',
): string {
    if (axios.isAxiosError(err)) {
        const data = err.response?.data as {
            message?: string;
            errors?: Record<string, string[]>;
        } | undefined;

        if (data?.errors) {
            const firstError = Object.values(data.errors)[0]?.[0];
            if (firstError) return firstError;
        }

        if (data?.message) return data.message;
    }

    return fallback;
}

export async function downloadBlob(
    url: string,
    params: Record<string, string | number>,
    filename: string,
) {
    const res = await api.get(url, {
        params,
        responseType: 'blob',
    });

    const blobUrl = window.URL.createObjectURL(
        new Blob([res.data]),
    );

    const link = document.createElement('a');
    link.href = blobUrl;
    link.setAttribute('download', filename);

    document.body.appendChild(link);
    link.click();
    link.remove();

    window.URL.revokeObjectURL(blobUrl);
}
