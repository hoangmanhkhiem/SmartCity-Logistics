export declare class CreateOrderDto {
    customerId?: string;
    pickupAddress?: string;
    pickupLat?: number;
    pickupLon?: number;
    deliveryAddress?: string;
    deliveryLat?: number;
    deliveryLon?: number;
    timeWindowStart?: string;
    timeWindowEnd?: string;
    priority?: number;
    notes?: string;
}
export declare class UpdateOrderDto {
    status?: string;
    pickupAddress?: string;
    pickupLat?: number;
    pickupLon?: number;
    deliveryAddress?: string;
    deliveryLat?: number;
    deliveryLon?: number;
    timeWindowStart?: string;
    timeWindowEnd?: string;
    priority?: number;
    notes?: string;
}
