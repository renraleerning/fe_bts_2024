// import axios
import axios from 'axios';

// ============================================================================
// 🌐 KONFIGURASI UTAMA ENDPOINT API & BACKEND (BTS)
// ============================================================================
// Tim deploy / developer HANYA PERLU MENGUBAH URL DI BAWAH INI (SATU TEMPAT SAJA):
// - Untuk Local Development : 'http://localhost:8000'
// - Untuk Production Hosting : 'https://bbts.smkn2sumedang.sch.id'
// ============================================================================
export const API_BASE_URL = process.env.VUE_APP_API_URL || 'https://bbts.smkn2sumedang.sch.id';

const Api = axios.create({
    baseURL: API_BASE_URL
});

/**
 * Helper universal untuk mengambil URL lengkap file storage (foto tamu, lampiran, banner flyer, tanda tangan, dll).
 * Mengacu otomatis ke API_BASE_URL di atas sehingga tidak ada URL yang di-hardcode di view mana pun.
 */
export const getStorageUrl = (path) => {
    if (!path) return '';
    if (typeof path !== 'string') return '';
    if (path.startsWith('data:')) return path;

    // Filter keluar jika path hanya berupa direktori kosong (misal: "http://.../storage/user/")
    const trimmed = path.trim().replace(/\/+$/, '');
    if (
        trimmed.endsWith('/storage/user') ||
        trimmed.endsWith('/storage/tamu') ||
        trimmed.endsWith('/storage/event_banner') ||
        trimmed.endsWith('/storage/lampiran') ||
        trimmed.endsWith('/storage/tamu_event')
    ) {
        return '';
    }

    const cleanBase = API_BASE_URL.replace(/\/+$/, '');

    // Jika path di-generate oleh accessor Laravel backend dengan localhost / 127.0.0.1 (karena APP_URL default)
    if (path.includes('localhost') || path.includes('127.0.0.1')) {
        const storageIndex = path.indexOf('/storage/');
        if (storageIndex !== -1) {
            return `${cleanBase}${path.substring(storageIndex)}`;
        }
    }

    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }

    const cleanPath = path.replace(/^\/+/, '');
    if (cleanPath.startsWith('storage/')) {
        return `${cleanBase}/${cleanPath}`;
    }
    return `${cleanBase}/storage/${cleanPath}`;
};

/**
 * Helper untuk mendapatkan URL endpoint API lengkap (misalnya untuk export excel, download file, atau direct link).
 */
export const getApiUrl = (endpoint = '') => {
    const cleanBase = API_BASE_URL.replace(/\/+$/, '');
    const cleanEndpoint = endpoint.replace(/^\/+/, '');
    return `${cleanBase}/${cleanEndpoint}`;
};

// Otomatis lampirkan token Authorization jika sudah login
Api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Tangani token kadaluarsa secara global
Api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            if (window.location.pathname !== '/signin') {
                window.location.href = '/signin';
            }
        }
        return Promise.reject(error);
    }
);

export default Api;