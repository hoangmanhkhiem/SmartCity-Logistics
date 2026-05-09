import axios from 'axios';

/**
 * Gọi API:
 * - Trình duyệt: mặc định `/api/v1` → Next rewrite sang Nest (xem next.config.ts).
 * - SSR / server: `INTERNAL_API_URL` hoặc http://127.0.0.1:3001/api/v1
 * - Ghi đè: NEXT_PUBLIC_API_URL (vd production)
 */
export const api = axios.create({
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const fromEnv = process.env.NEXT_PUBLIC_API_URL;
    if (fromEnv) {
        config.baseURL = fromEnv;
    } else if (typeof window !== 'undefined') {
        config.baseURL = '/api/v1';
    } else {
        config.baseURL = process.env.INTERNAL_API_URL || 'http://127.0.0.1:3001/api/v1';
    }

    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            if (typeof window !== 'undefined') {
                localStorage.removeItem('accessToken');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authApi = {
    login: (data: { email: string; password: string }) => api.post('/auth/login', data),
    register: (data: { email: string; password: string; name: string; phone?: string }) => api.post('/auth/register', data),
};

// Organization API
export const organizationApi = {
    getAll: (params?: any) => api.get('/organizations', { params }),
    getById: (id: string) => api.get(`/organizations/${id}`),
    create: (data: any) => api.post('/organizations', data),
    update: (id: string, data: any) => api.patch(`/organizations/${id}`, data),
    delete: (id: string) => api.delete(`/organizations/${id}`),
};

// Carrier API
export const carrierApi = {
    getAll: (params?: any) => api.get('/carriers', { params }),
    getById: (id: string) => api.get(`/carriers/${id}`),
    create: (data: any) => api.post('/carriers', data),
    update: (id: string, data: any) => api.patch(`/carriers/${id}`, data),
    delete: (id: string) => api.delete(`/carriers/${id}`),
};

// Vehicle API
export const vehicleApi = {
    getAll: (params?: any) => api.get('/vehicles', { params }),
    getById: (id: string) => api.get(`/vehicles/${id}`),
    create: (data: any) => api.post('/vehicles', data),
    update: (id: string, data: any) => api.patch(`/vehicles/${id}`, data),
    delete: (id: string) => api.delete(`/vehicles/${id}`),
};

// Facility API
export const facilityApi = {
    getAll: (params?: any) => api.get('/facilities', { params }),
    getById: (id: string) => api.get(`/facilities/${id}`),
    create: (data: any) => api.post('/facilities', data),
    update: (id: string, data: any) => api.patch(`/facilities/${id}`, data),
    delete: (id: string) => api.delete(`/facilities/${id}`),
};

// Zone API
export const zoneApi = {
    getAll: (params?: any) => api.get('/zones', { params }),
    getById: (id: string) => api.get(`/zones/${id}`),
    create: (data: any) => api.post('/zones', data),
    update: (id: string, data: any) => api.patch(`/zones/${id}`, data),
    delete: (id: string) => api.delete(`/zones/${id}`),
};

// Order API
export const orderApi = {
    getAll: (params?: any) => api.get('/orders', { params }),
    getById: (id: string) => api.get(`/orders/${id}`),
    create: (data: any) => api.post('/orders', data),
    update: (id: string, data: any) => api.patch(`/orders/${id}`, data),
    delete: (id: string) => api.delete(`/orders/${id}`),
};

// Route API
export const routeApi = {
    getAll: (params?: any) => api.get('/routes', { params }),
    getById: (id: string) => api.get(`/routes/${id}`),
    create: (data: any) => api.post('/routes', data),
    update: (id: string, data: any) => api.patch(`/routes/${id}`, data),
    delete: (id: string) => api.delete(`/routes/${id}`),
    optimizeStops: (points: { id?: string; lat: number; lon: number }[]) =>
        api.post('/routes/optimize-stops', { points }),
};

// Telemetry API
export const telemetryApi = {
    getAll: (params?: any) => api.get('/telemetry', { params }),
    getByVehicle: (vehicleId: string, params?: any) => api.get(`/telemetry/vehicle/${vehicleId}`, { params }),
    getLatest: (vehicleId: string) => api.get(`/telemetry/vehicle/${vehicleId}/latest`),
    create: (data: any) => api.post('/telemetry', data),
};

// Research / field collection tables (read-only)
export const researchApi = {
    getTables: () => api.get<{ key: string; label: string; dbTable: string }[]>('/research/tables'),
    getRows: (tableKey: string, params?: { skip?: number; take?: number }) =>
        api.get<{
            tableKey: string;
            total: number;
            skip: number;
            take: number;
            rows: Record<string, unknown>[];
        }>(`/research/${encodeURIComponent(tableKey)}/rows`, { params }),
};

// Platform analytics (dashboard)
export const analyticsApi = {
    getPlatformSummary: () => api.get('/analytics/platform-summary'),
};

// Dispatch / assignment
export const dispatchApi = {
    getUnassignedLegs: () => api.get('/dispatch/unassigned-legs'),
    getRecentAssignments: (params?: { limit?: number }) =>
        api.get('/dispatch/assignments/recent', { params }),
    assign: (data: { legId: string; vehicleId: string; driverId?: string }) => api.post('/dispatch/assign', data),
    batchAssign: (data: { legIds: string[]; vehicleId: string; driverId?: string }) =>
        api.post('/dispatch/batch-assign', data),
    enqueueOrder: (orderId: string) => api.post(`/dispatch/orders/${encodeURIComponent(orderId)}/enqueue`),
    suggestVehicle: (legId: string) => api.post(`/dispatch/suggest-vehicle/${legId}`),
};

// Carrier quote comparison (stub)
export const quotesApi = {
    compare: (params: { pickupLat: number; pickupLon: number; deliveryLat: number; deliveryLon: number; weightKg?: number }) =>
        api.get('/quotes/compare', { params }),
};

// B2B API key management
export const integrationsApi = {
    listApiClients: () => api.get('/integrations/api-clients'),
    createApiClient: (name: string) => api.post('/integrations/api-clients', { name }),
};

// Drivers (role = driver)
export const driversApi = {
    list: () => api.get('/drivers'),
    getStats: (id: string) => api.get(`/drivers/${id}/stats`),
};

// Public tracking by tracking number (no JWT required on server; token may still be sent)
export const trackingApi = {
    getShipment: (trackingNo: string) => api.get(`/tracking/shipments/${encodeURIComponent(trackingNo)}`),
    /** Mã vận đơn, mã đơn, hoặc SĐT (9 số cuối) */
    search: (q: string) => api.get('/tracking/search', { params: { q } }),
};

// User API
export const userApi = {
    getAll: (params?: any) => api.get('/users', { params }),
    getById: (id: string) => api.get(`/users/${id}`),
    update: (id: string, data: any) => api.patch(`/users/${id}`, data),
    delete: (id: string) => api.delete(`/users/${id}`),
};
