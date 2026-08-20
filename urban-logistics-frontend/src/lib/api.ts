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
    getById: (id: number) => api.get(`/organizations/${id}`),
    create: (data: any) => api.post('/organizations', data),
    update: (id: number, data: any) => api.patch(`/organizations/${id}`, data),
    delete: (id: number) => api.delete(`/organizations/${id}`),
};

// Carrier API
export const carrierApi = {
    getAll: (params?: any) => api.get('/carriers', { params }),
    getById: (id: number) => api.get(`/carriers/${id}`),
    create: (data: any) => api.post('/carriers', data),
    update: (id: number, data: any) => api.patch(`/carriers/${id}`, data),
    delete: (id: number) => api.delete(`/carriers/${id}`),
    updateZones: (id: number, zoneIds: number[]) => api.patch(`/carriers/${id}/zones`, { zoneIds }),
    compareForRoute: (params: { pickupLat: number; pickupLon: number; deliveryLat: number; deliveryLon: number; weightKg?: number }) =>
        api.get('/carriers/compare', { params }),
};

// Vehicle API
export const vehicleApi = {
    getAll: (params?: any) => api.get('/vehicles', { params }),
    getById: (id: number) => api.get(`/vehicles/${id}`),
    create: (data: any) => api.post('/vehicles', data),
    update: (id: number, data: any) => api.patch(`/vehicles/${id}`, data),
    delete: (id: number) => api.delete(`/vehicles/${id}`),
};

// Facility API
export const facilityApi = {
    getAll: (params?: any) => api.get('/facilities', { params }),
    getById: (id: number) => api.get(`/facilities/${id}`),
    create: (data: any) => api.post('/facilities', data),
    update: (id: number, data: any) => api.patch(`/facilities/${id}`, data),
    delete: (id: number) => api.delete(`/facilities/${id}`),
};

// Zone API
export const zoneApi = {
    getAll: (params?: any) => api.get('/zones', { params }),
    getById: (id: number) => api.get(`/zones/${id}`),
    create: (data: any) => api.post('/zones', data),
    update: (id: number, data: any) => api.patch(`/zones/${id}`, data),
    delete: (id: number) => api.delete(`/zones/${id}`),
};

// Order API
export const orderApi = {
    getAll: (params?: any) => api.get('/orders', { params }),
    getById: (id: number) => api.get(`/orders/${id}`),
    create: (data: any) => api.post('/orders', data),
    update: (id: number, data: any) => api.patch(`/orders/${id}`, data),
    delete: (id: number) => api.delete(`/orders/${id}`),
};

// Route API (chuyến giao — gom order theo zone thành route của 1 xe/1 shipper/1 ca)
export const routeApi = {
    getAll: (params?: { page?: number; limit?: number; carrierId?: number; status?: string; shipperId?: number }) =>
        api.get('/routes', { params }),
    getById: (id: number) => api.get(`/routes/${id}`),
    createFromOrders: (data: {
        carrierId: number;
        vehicleId: number;
        shipperId: number;
        zoneId?: number;
        orderIds: number[];
        shiftDate: string;
        plannedStartAt?: string;
        force?: boolean;
    }) => api.post('/routes', data),
    update: (id: number, data: any) => api.patch(`/routes/${id}`, data),
    delete: (id: number) => api.delete(`/routes/${id}`),
    getUnassignedOrders: (carrierId: number, zoneId?: number) =>
        api.get('/routes/unassigned-orders', { params: { carrierId, zoneId } }),
    suggestVehicleShipper: (carrierId: number, zoneId?: number) =>
        api.get('/routes/suggest-vehicle-shipper', { params: { carrierId, zoneId } }),
    optimizeStops: (points: { id?: number; lat: number; lon: number }[]) =>
        api.post('/routes/optimize-stops', { points }),
    suggestFacilities: (data: {
        originLat: number;
        originLon: number;
        destLat: number;
        destLon: number;
        kinds?: string[];
        bufferMeters?: number;
        limit?: number;
        departureTime?: string;
        restrictionAt?: string;
        restrictionVehicleType?: string;
    }) => api.post('/routes/suggest-facilities', data),
    drivingSegment: (data: {
        originLat: number;
        originLon: number;
        destLat: number;
        destLon: number;
        restrictionAt?: string;
        restrictionVehicleType?: string;
    }) => api.post('/routes/driving-segment', data),
};

// Traffic restrictions (cấm / hạn chế đường) — active GeoJSON không cần auth
export const restrictionApi = {
    getActiveGeoJson: (params?: { at?: string; vehicleType?: string }) =>
        api.get('/restrictions/active/geojson', { params }),
    getAll: () => api.get('/restrictions'),
    create: (data: Record<string, unknown>) => api.post('/restrictions', data),
    update: (id: number, data: Record<string, unknown>) => api.patch(`/restrictions/${id}`, data),
    delete: (id: number) => api.delete(`/restrictions/${id}`),
};

export const roadSegmentApi = {
    getAll: (params?: { zoneId?: number; includeInactive?: boolean }) =>
        api.get('/road-segments', { params }),
    getById: (id: number) => api.get(`/road-segments/${id}`),
    create: (data: Record<string, unknown>) => api.post('/road-segments', data),
    update: (id: number, data: Record<string, unknown>) => api.patch(`/road-segments/${id}`, data),
    delete: (id: number) => api.delete(`/road-segments/${id}`),
};

// Telemetry API
export const telemetryApi = {
    getAll: (params?: any) => api.get('/telemetry', { params }),
    getByVehicle: (vehicleId: number, params?: any) => api.get(`/telemetry/vehicle/${vehicleId}`, { params }),
    getLatest: (vehicleId: number) => api.get(`/telemetry/vehicle/${vehicleId}/latest`),
    create: (data: any) => api.post('/telemetry', data),
};

// Platform analytics (dashboard)
export const analyticsApi = {
    getPlatformSummary: () => api.get('/analytics/platform-summary'),
    createSnapshot: () => api.post('/analytics/snapshot'),
    getTrend: (params?: { carrierId?: number; from?: string; to?: string }) =>
        api.get('/analytics/trend', { params }),
    getComplianceReport: (params?: { from?: string; to?: string }) =>
        api.get('/analytics/compliance-report', { params }),
};

// B2B API key management
export const integrationsApi = {
    listApiClients: () => api.get('/integrations/api-clients'),
    createApiClient: (name: string, carrierId?: number) =>
        api.post('/integrations/api-clients', { name, carrierId }),
};

// Shippers (role = shipper) — quản lý bởi carrier-ops + self-service cho chính shipper
export const shipperApi = {
    listByCarrier: (carrierId?: number) => api.get('/shippers', { params: { carrierId } }),
    createProfile: (data: { userId: number; carrierId: number; licenseNumber?: string; licenseClass?: string; defaultZoneId?: number }) =>
        api.post('/shippers', data),
    getStats: (userId: number) => api.get(`/shippers/${userId}/stats`),
    clockIn: (userId: number, vehicleId: number) => api.post(`/shippers/${userId}/clock-in`, { vehicleId }),
    clockOut: (userId: number) => api.post(`/shippers/${userId}/clock-out`),

    // Self-service (JWT của chính shipper)
    getTodayRoute: () => api.get('/shippers/me/routes/today'),
    getRoute: (routeId: number) => api.get(`/shippers/me/routes/${routeId}`),
    getDirectionsToNextStop: (routeId: number) => api.get(`/shippers/me/routes/${routeId}/directions`),
    startRoute: (routeId: number) => api.patch(`/shippers/me/routes/${routeId}/start`),
    completeRoute: (routeId: number) => api.patch(`/shippers/me/routes/${routeId}/complete`),
    arriveStop: (stopId: number) => api.patch(`/shippers/me/stops/${stopId}/arrive`),
    completeStop: (stopId: number, data: { podPhotoUrl?: string; podSignatureUrl?: string; podNote?: string; codAmountCollected?: number }) =>
        api.patch(`/shippers/me/stops/${stopId}/complete`, data),
    failStop: (stopId: number, data: { failedReason: string; note?: string }) =>
        api.patch(`/shippers/me/stops/${stopId}/fail`, data),
};

// Public tracking by tracking number (no JWT required on server; token may still be sent)
export const trackingApi = {
    getByTrackingNo: (trackingNo: string) => api.get(`/tracking/shipments/${encodeURIComponent(trackingNo)}`),
    /** Mã vận đơn, mã đơn, hoặc SĐT (9 số cuối) */
    search: (q: string) => api.get('/tracking/search', { params: { q } }),
};

// User API
export const userApi = {
    getAll: (params?: any) => api.get('/users', { params }),
    getById: (id: number) => api.get(`/users/${id}`),
    update: (id: number, data: any) => api.patch(`/users/${id}`, data),
    delete: (id: number) => api.delete(`/users/${id}`),
};
