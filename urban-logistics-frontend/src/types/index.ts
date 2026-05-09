// Common types
export interface PaginationMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface PaginatedResponse<T> {
    data: T[];
    meta: PaginationMeta;
}

// Organization
export interface Organization {
    id: string;
    name: string;
    type: string;
    business?: string;
    description?: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

// Carrier
export interface Carrier {
    id: string;
    organizationId: string;
    name: string;
    scale?: string;
    vehicleCount?: number;
    warehouseCount?: number;
    contactName?: string;
    contactPhone?: string;
    contactEmail?: string;
    isActive: boolean;
    organization?: Organization;
}

// Vehicle
export interface Vehicle {
    id: string;
    carrierId: string;
    type: string;
    plate: string;
    brand?: string;
    model?: string;
    capacity?: number;
    volume?: number;
    fuelType?: string;
    isElectric: boolean;
    emissionStandard?: string;
    emissionFactor?: number;
    range?: number;
    status: 'available' | 'in_use' | 'maintenance';
    isActive: boolean;
    carrier?: Carrier;
}

// Facility
export interface Facility {
    id: string;
    organizationId: string;
    zoneId?: string;
    name: string;
    kind: string;
    latitude: number;
    longitude: number;
    address?: string;
    capacity?: number;
    openingTime?: string;
    closingTime?: string;
    isActive: boolean;
    organization?: Organization;
    zone?: Zone;
}

// Zone
export interface Zone {
    id: string;
    name: string;
    type?: string;
    description?: string;
    boundary?: string;
    isActive: boolean;
}

// Order
export interface Order {
    id: string;
    customerId?: string;
    orderNumber: string;
    status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
    pickupAddress?: string;
    pickupLat?: number;
    pickupLon?: number;
    deliveryAddress?: string;
    deliveryLat?: number;
    deliveryLon?: number;
    timeWindowStart?: string;
    timeWindowEnd?: string;
    priority: number;
    notes?: string;
    pickupPhone?: string;
    deliveryPhone?: string;
    sourceUrl?: string;
    externalRef?: string;
    fulfillmentChannel?: string;
    createdAt: string;
    updatedAt: string;
}

// Route
export interface Route {
    id: string;
    name: string;
    mode: string;
    description?: string;
    totalDistance?: number;
    totalDuration?: number;
    estimatedCo2?: number;
    geometry?: string;
    status: 'planned' | 'active' | 'completed';
    isActive: boolean;
}

// Telemetry
export interface Telemetry {
    id: string;
    vehicleId: string;
    timestamp: string;
    latitude: number;
    longitude: number;
    speed?: number;
    heading?: number;
    batteryLevel?: number;
    fuelLevel?: number;
    vehicle?: Vehicle;
}

// User
export interface User {
    id: string;
    email: string;
    name: string;
    phone?: string;
    avatarUrl?: string;
    isActive: boolean;
    lastLoginAt?: string;
    createdAt: string;
    updatedAt: string;
}

// Stats
export interface DashboardStats {
    totalOrders: number;
    pendingOrders: number;
    completedOrders: number;
    totalVehicles: number;
    activeVehicles: number;
    totalFacilities: number;
    totalCo2Saved?: number;
}
