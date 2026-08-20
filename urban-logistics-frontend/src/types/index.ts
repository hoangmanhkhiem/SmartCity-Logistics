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
    id: number;
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

// Carrier (last-mile nội đô)
export interface Carrier {
    id: number;
    organizationId: number;
    name: string;
    operatingZoneIds: number[];
    serviceType: string;
    contactName?: string;
    contactPhone?: string;
    contactEmail?: string;
    isActive: boolean;
    organization?: Organization;
}

// Vehicle
export interface Vehicle {
    id: number;
    carrierId: number;
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
    id: number;
    organizationId: number;
    zoneId?: number;
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
    id: number;
    name: string;
    type?: string;
    description?: string;
    boundary?: string;
    isActive: boolean;
}

// Order
export interface Order {
    id: number;
    carrierId: number;
    customerId?: number;
    zoneId?: number;
    orderNumber: string;
    trackingNo: string;
    status: 'pending' | 'assigned' | 'in_transit' | 'delivered' | 'failed' | 'cancelled';
    pickupAddress?: string;
    pickupLat?: number;
    pickupLon?: number;
    deliveryAddress?: string;
    deliveryLat?: number;
    deliveryLon?: number;
    weightKg?: number;
    itemCount?: number;
    codAmount?: number;
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
    zone?: Zone;
    customer?: User;
}

// Stop (điểm dừng trong Route — pickup/delivery của 1 order)
export interface Stop {
    id: number;
    routeId: number;
    orderId: number;
    sequence: number;
    type: 'pickup' | 'delivery';
    address?: string;
    latitude: number;
    longitude: number;
    contactName?: string;
    contactPhone?: string;
    timeWindowStart?: string;
    timeWindowEnd?: string;
    status: 'pending' | 'arrived' | 'completed' | 'failed' | 'skipped';
    arrivedAt?: string;
    completedAt?: string;
    failedReason?: string;
    podPhotoUrl?: string;
    podSignatureUrl?: string;
    podNote?: string;
    codAmountDue?: number;
    codAmountCollected?: number;
    codCollected: boolean;
    codCollectedAt?: string;
    order?: Order;
}

// Route (chuyến giao của 1 xe + 1 shipper trong 1 ca)
export interface Route {
    id: number;
    carrierId: number;
    vehicleId: number;
    shipperId: number;
    zoneId?: number;
    code: string;
    shiftDate: string;
    status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
    plannedStartAt?: string;
    plannedEndAt?: string;
    actualStartAt?: string;
    actualEndAt?: string;
    totalDistanceKm?: number;
    totalDurationMin?: number;
    estimatedCo2Grams?: number;
    geometry?: string;
    notes?: string;
    vehicle?: Vehicle;
    shipper?: User;
    zone?: Zone;
    stops?: Stop[];
}

// Telemetry
export interface Telemetry {
    id: number;
    vehicleId: number;
    timestamp: string;
    latitude: number;
    longitude: number;
    speed?: number;
    heading?: number;
    batteryLevel?: number;
    fuelLevel?: number;
    vehicle?: Vehicle;
}

// Role
export interface Role {
    id: number;
    name: string;
    description?: string;
}

// Membership
export interface Membership {
    id: number;
    userId: number;
    organizationId: number;
    roleId: number;
    role?: Role;
    organization?: Organization;
}

// User
export interface User {
    id: number;
    email: string;
    name?: string;
    phone?: string;
    avatarUrl?: string;
    isActive: boolean;
    lastLoginAt?: string;
    createdAt: string;
    updatedAt: string;
    memberships?: Membership[];
}

// ShipperProfile
export interface ShipperProfile {
    id: number;
    userId: number;
    carrierId: number;
    licenseNumber?: string;
    licenseClass?: string;
    defaultZoneId?: number;
    currentVehicleId?: number;
    status: 'off_duty' | 'on_shift' | 'on_break';
    isActive: boolean;
    user?: User;
    currentVehicle?: Vehicle;
    defaultZone?: Zone;
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
