import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
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
};

// Telemetry API
export const telemetryApi = {
    getAll: (params?: any) => api.get('/telemetry', { params }),
    getByVehicle: (vehicleId: string, params?: any) => api.get(`/telemetry/vehicle/${vehicleId}`, { params }),
    getLatest: (vehicleId: string) => api.get(`/telemetry/vehicle/${vehicleId}/latest`),
    create: (data: any) => api.post('/telemetry', data),
};

// User API
export const userApi = {
    getAll: (params?: any) => api.get('/users', { params }),
    getById: (id: string) => api.get(`/users/${id}`),
    update: (id: string, data: any) => api.patch(`/users/${id}`, data),
    delete: (id: string) => api.delete(`/users/${id}`),
};
