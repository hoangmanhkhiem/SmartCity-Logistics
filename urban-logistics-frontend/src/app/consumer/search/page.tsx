'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardBody, CardHeader, Input, Select, Button, Badge, Modal } from '@/components/ui';
import { facilityApi, zoneApi } from '@/lib/api';
import { Facility, Zone } from '@/types';
import { Search, MapPin, Building2, Zap, Fuel, Warehouse, Clock, Phone, Navigation } from 'lucide-react';

// Dynamic import for Map to avoid SSR issues
const MapView = dynamic(() => import('@/components/shared/map'), {
    ssr: false,
    loading: () => (
        <div className="h-80 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
            <div className="flex items-center gap-2 text-gray-500">
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                Đang tải bản đồ...
            </div>
        </div>
    )
});

const facilityKindOptions = [
    { value: '', label: 'Tất cả loại cơ sở' },
    { value: 'hub', label: 'Hub giao nhận' },
    { value: 'warehouse', label: 'Kho bãi' },
    { value: 'charging_station', label: 'Trạm sạc' },
    { value: 'fuel_station', label: 'Trạm xăng' },
    { value: 'pickup_point', label: 'Điểm giao nhận' },
];

const kindIcons: Record<string, React.ReactNode> = {
    hub: <Building2 size={20} />,
    warehouse: <Warehouse size={20} />,
    charging_station: <Zap size={20} />,
    fuel_station: <Fuel size={20} />,
    pickup_point: <MapPin size={20} />,
};

const kindColors: Record<string, string> = {
    hub: 'bg-blue-500',
    warehouse: 'bg-purple-500',
    charging_station: 'bg-green-500',
    fuel_station: 'bg-orange-500',
    pickup_point: 'bg-pink-500',
};

export default function ConsumerSearchPage() {
    const [facilities, setFacilities] = useState<Facility[]>([]);
    const [zones, setZones] = useState<Zone[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [kindFilter, setKindFilter] = useState('');
    const [zoneFilter, setZoneFilter] = useState('');
    const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
    const [showDirections, setShowDirections] = useState(false);
    const [userLocation, setUserLocation] = useState<[number, number]>([105.8542, 21.0285]); // Default Hanoi

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [facilitiesRes, zonesRes] = await Promise.all([
                    facilityApi.getAll({ limit: 50 }),
                    zoneApi.getAll({ limit: 50 }),
                ]);
                setFacilities(facilitiesRes.data.data || facilitiesRes.data);
                setZones(zonesRes.data.data || zonesRes.data);
            } catch (error) {
                console.error('Failed to fetch data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();

        // Try to get user's location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation([position.coords.longitude, position.coords.latitude]);
                },
                () => {
                    console.log('Could not get user location, using default');
                }
            );
        }
    }, []);

    const handleShowDirections = (facility: Facility) => {
        setSelectedFacility(facility);
        setShowDirections(true);
    };

    const filteredFacilities = facilities.filter((f) => {
        const matchesSearch =
            f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            f.address?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesKind = !kindFilter || f.kind === kindFilter;
        const matchesZone = !zoneFilter || f.zoneId === zoneFilter;
        return matchesSearch && matchesKind && matchesZone;
    });

    const zoneOptions = [
        { value: '', label: 'Tất cả khu vực' },
        ...zones.map((z) => ({ value: z.id, label: z.name })),
    ];

    // Route config for directions
    const routeConfig = selectedFacility ? {
        start: userLocation,
        end: [selectedFacility.longitude, selectedFacility.latitude] as [number, number],
    } : undefined;

    // Map markers for directions
    const directionsMarkers = selectedFacility ? [
        {
            id: 'user',
            coordinates: userLocation,
            type: 'vehicle' as const,
            label: 'Vị trí của bạn',
            popup: 'Điểm xuất phát',
        },
        {
            id: 'facility',
            coordinates: [selectedFacility.longitude, selectedFacility.latitude] as [number, number],
            type: 'facility' as const,
            label: selectedFacility.name,
            popup: selectedFacility.address || selectedFacility.kind,
        },
    ] : [];

    // All facilities markers for main map view
    const allFacilitiesMarkers = facilities.map((f) => ({
        id: f.id,
        coordinates: [f.longitude, f.latitude] as [number, number],
        type: 'facility' as const,
        label: f.name,
        popup: `${facilityKindOptions.find(k => k.value === f.kind)?.label || f.kind}<br/>${f.address || ''}`,
    }));

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Tìm kiếm cơ sở</h1>
                <p className="text-gray-500 mt-1">Tìm Hub, trạm sạc, điểm giao nhận gần bạn</p>
            </div>

            <Card>
                <CardBody className="space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <Input
                            placeholder="Tìm kiếm theo tên hoặc địa chỉ..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 text-lg py-3"
                        />
                    </div>
                    <div className="flex flex-wrap gap-4">
                        <div className="flex-1 min-w-[180px]">
                            <Select options={facilityKindOptions} value={kindFilter} onChange={setKindFilter} />
                        </div>
                        <div className="flex-1 min-w-[180px]">
                            <Select options={zoneOptions} value={zoneFilter} onChange={setZoneFilter} />
                        </div>
                        <Button variant="outline" onClick={() => { setSearchQuery(''); setKindFilter(''); setZoneFilter(''); }}>
                            Xóa bộ lọc
                        </Button>
                    </div>
                </CardBody>
            </Card>

            {/* Map overview */}
            <Card>
                <CardHeader>
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Bản đồ cơ sở</h2>
                </CardHeader>
                <CardBody>
                    <div className="h-64">
                        <MapView
                            center={userLocation}
                            zoom={12}
                            markers={allFacilitiesMarkers}
                            onMarkerClick={(id) => {
                                const facility = facilities.find(f => f.id === id);
                                if (facility) setSelectedFacility(facility);
                            }}
                        />
                    </div>
                </CardBody>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? (
                    <div className="col-span-full flex justify-center py-12">
                        <div className="flex items-center gap-2 text-gray-500">
                            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            Đang tải...
                        </div>
                    </div>
                ) : filteredFacilities.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-gray-500">
                        <Building2 size={48} className="mx-auto mb-2 opacity-50" />
                        <p>Không tìm thấy cơ sở phù hợp</p>
                    </div>
                ) : (
                    filteredFacilities.map((facility) => (
                        <div key={facility.id} onClick={() => setSelectedFacility(facility)} className="cursor-pointer">
                            <Card hover>
                                <CardBody>
                                    <div className="flex items-start gap-3">
                                        <div className={`p-3 rounded-xl text-white ${kindColors[facility.kind] || 'bg-gray-500'}`}>
                                            {kindIcons[facility.kind] || <Building2 size={20} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-gray-800 dark:text-white truncate">{facility.name}</h3>
                                            <p className="text-sm text-gray-500 mt-1 truncate">{facility.address || 'Chưa có địa chỉ'}</p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <Badge variant="secondary">{facilityKindOptions.find((k) => k.value === facility.kind)?.label || facility.kind}</Badge>
                                                {facility.isActive ? <Badge variant="success">Hoạt động</Badge> : <Badge variant="error">Đóng cửa</Badge>}
                                            </div>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        </div>
                    ))
                )}
            </div>

            {/* Facility Detail Card */}
            {selectedFacility && !showDirections && (
                <Card className="fixed bottom-0 left-0 right-0 md:left-auto md:right-6 md:bottom-6 md:w-96 shadow-2xl z-40">
                    <CardHeader className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-800 dark:text-white">{selectedFacility.name}</h3>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedFacility(null)}>✕</Button>
                    </CardHeader>
                    <CardBody className="space-y-3">
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                            <MapPin size={16} />
                            <span>{selectedFacility.address || 'Chưa có địa chỉ'}</span>
                        </div>
                        {selectedFacility.openingTime && (
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                <Clock size={16} />
                                <span>{selectedFacility.openingTime} - {selectedFacility.closingTime}</span>
                            </div>
                        )}
                        {selectedFacility.capacity && (
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                <Warehouse size={16} />
                                <span>Sức chứa: {selectedFacility.capacity}</span>
                            </div>
                        )}
                        <div className="pt-3 border-t flex gap-2">
                            <Button className="flex-1" onClick={() => handleShowDirections(selectedFacility)}>
                                <Navigation size={16} className="mr-1" />Chỉ đường
                            </Button>
                            <Button variant="outline" className="flex-1"><Phone size={16} className="mr-1" />Liên hệ</Button>
                        </div>
                    </CardBody>
                </Card>
            )}

            {/* Directions Modal */}
            <Modal
                isOpen={showDirections && !!selectedFacility}
                onClose={() => setShowDirections(false)}
                title={`Chỉ đường đến ${selectedFacility?.name || ''}`}
                size="xl"
            >
                {selectedFacility && (
                    <div className="space-y-4">
                        {/* Map with route */}
                        <div className="h-80 rounded-lg overflow-hidden">
                            <MapView
                                center={[selectedFacility.longitude, selectedFacility.latitude]}
                                zoom={13}
                                markers={directionsMarkers}
                                route={routeConfig}
                            />
                        </div>

                        {/* Route info */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Điểm xuất phát</span>
                                </div>
                                <p className="text-sm text-gray-500">Vị trí hiện tại của bạn</p>
                            </div>
                            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Điểm đến</span>
                                </div>
                                <p className="text-sm text-gray-500 truncate">{selectedFacility.address || selectedFacility.name}</p>
                            </div>
                        </div>

                        {/* Facility info */}
                        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className={`p-3 rounded-xl text-white ${kindColors[selectedFacility.kind] || 'bg-gray-500'}`}>
                                    {kindIcons[selectedFacility.kind] || <Building2 size={20} />}
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-800 dark:text-white">{selectedFacility.name}</h4>
                                    <p className="text-sm text-gray-500">{facilityKindOptions.find(k => k.value === selectedFacility.kind)?.label || selectedFacility.kind}</p>
                                </div>
                            </div>
                            {selectedFacility.openingTime && (
                                <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                                    <Clock size={14} />
                                    <span>Giờ mở cửa: {selectedFacility.openingTime} - {selectedFacility.closingTime}</span>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setShowDirections(false)}>Đóng</Button>
                            <Button onClick={() => {
                                // Open Google Maps directions
                                window.open(`https://www.google.com/maps/dir/?api=1&origin=${userLocation[1]},${userLocation[0]}&destination=${selectedFacility.latitude},${selectedFacility.longitude}`, '_blank');
                            }}>
                                <Navigation size={16} className="mr-1" />Mở Google Maps
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
