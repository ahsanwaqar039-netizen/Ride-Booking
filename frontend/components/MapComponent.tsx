'use client';

import { MapContainer, TileLayer, Marker, useMapEvents, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState, useCallback } from 'react';

const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const RecenterMap = ({ pos }: { pos: [number, number] | null }) => {
    const map = useMap();
    useEffect(() => {
        if (pos) map.setView(pos, 14);
    }, [pos, map]);
    return null;
};

const MapClickHandler = ({ onClick }: { onClick: (e: L.LeafletMouseEvent) => void }) => {
    useMapEvents({
        click: onClick
    });
    return null;
};

interface UserLocation {
    userId: number;
    role: string;
    lat: number;
    lng: number;
}

interface MapProps {
    onLocationSelect?: (pickup: [number, number], dropoff: [number, number], distance: number) => void;
    trackingRide?: {
        pickup: [number, number];
        dropoff: [number, number];
        status: string;
        driverId?: number;
    } | null;
    externalPickup?: [number, number] | null;
    externalDropoff?: [number, number] | null;
    liveUsers?: Record<number, UserLocation>;
    onPickupSelect?: (lat: number, lng: number) => void;
    onDropoffSelect?: (lat: number, lng: number) => void;
    currentUserId?: number | null;
}

export default function MapComponent({ onLocationSelect, trackingRide, externalPickup, externalDropoff, liveUsers, onPickupSelect, onDropoffSelect, currentUserId }: MapProps) {
    const [pickup, setPickup] = useState<[number, number] | null>(null);
    const [dropoff, setDropoff] = useState<[number, number] | null>(null);
    const [driverPos, setDriverPos] = useState<[number, number] | null>(null);

    const riderIcon = L.divIcon({
        className: 'marker-rider',
        html: `<div class="rider-dot"></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
    });

    useEffect(() => {
        if (externalPickup) setPickup(externalPickup);
    }, [externalPickup]);

    useEffect(() => {
        if (externalDropoff) setDropoff(externalDropoff);
    }, [externalDropoff]);

    const carIcon = L.divIcon({
        className: 'car-icon',
        html: `<div class="car-wrapper">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="var(--primary)"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/></svg>
               </div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
    });

    const pickupIcon = L.divIcon({
        className: 'marker-pickup',
        html: `<div class="marker-pin pickup-pin"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    });

    const dropoffIcon = L.divIcon({
        className: 'marker-dropoff',
        html: `<div class="marker-pin dropoff-pin"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    });


    useEffect(() => {
        if (trackingRide) {
            setPickup(trackingRide.pickup);
            setDropoff(trackingRide.dropoff);

            if (trackingRide.driverId && liveUsers && liveUsers[trackingRide.driverId]) {
                const driverLocation = liveUsers[trackingRide.driverId];
                setDriverPos([driverLocation.lat, driverLocation.lng]);
            } else if (!driverPos) {
                setDriverPos([trackingRide.pickup[0] + 0.005, trackingRide.pickup[1] + 0.005]);
            }
        }
    }, [trackingRide, liveUsers]);

    const calculateDistance = (p1: [number, number], p2: [number, number]) => {
        const lat1 = p1[0], lon1 = p1[1];
        const lat2 = p2[0], lon2 = p2[1];
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    const handleMapClick = useCallback((e: L.LeafletMouseEvent) => {
        if (trackingRide) return;
        if (!pickup) {
            setPickup([e.latlng.lat, e.latlng.lng]);
            if (onPickupSelect) onPickupSelect(e.latlng.lat, e.latlng.lng);
        } else if (!dropoff) {
            const newDropoff: [number, number] = [e.latlng.lat, e.latlng.lng];
            setDropoff(newDropoff);
            if (onDropoffSelect) onDropoffSelect(e.latlng.lat, e.latlng.lng);

            const dist = calculateDistance(pickup, newDropoff);
            if (onLocationSelect) onLocationSelect(pickup, newDropoff, dist);
        } else {
            setPickup([e.latlng.lat, e.latlng.lng]);
            setDropoff(null);
            if (onPickupSelect) onPickupSelect(e.latlng.lat, e.latlng.lng);
        }
    }, [pickup, dropoff, trackingRide, onPickupSelect, onDropoffSelect, onLocationSelect]);

    return (
        <div className="map-wrapper glass">
            <MapContainer center={[33.6844, 73.0479]} zoom={13} zoomControl={false} style={{ height: '100%', width: '100%', borderRadius: '24px' }}>
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />
                <MapClickHandler onClick={handleMapClick} />
                <RecenterMap pos={externalDropoff || externalPickup || null} />

                {liveUsers && Object.values(liveUsers).map(u => {
                    const isMe = u.userId === currentUserId;
                    const isMyDriver = trackingRide?.driverId === u.userId;


                    if (trackingRide && !isMe && !isMyDriver) return null;

                    return (
                        <Marker
                            key={u.userId}
                            position={[u.lat, u.lng]}
                            icon={isMe ? (u.role === 'Driver' ? carIcon : riderIcon) : (u.role === 'Driver' ? carIcon : riderIcon)}
                            zIndexOffset={isMe ? 2000 : (u.role === 'Driver' ? 1000 : 500)}
                        />
                    );
                })}

                {pickup && <Marker position={pickup} icon={pickupIcon} />}
                {dropoff && <Marker position={dropoff} icon={dropoffIcon} />}

                {pickup && dropoff && <Polyline positions={[pickup, dropoff]} color="var(--primary)" weight={4} opacity={0.6} dashArray="8, 12" />}
            </MapContainer>




            <div className="map-overlay">
                {trackingRide ? (
                    <div className="tracking-status">
                        <div className="pulse-mini"></div>
                        <p>Driver is <b>{trackingRide.status === 'Accepted' ? 'arriving' : 'on the way'}</b></p>
                    </div>
                ) : (!pickup ? <p>Set <b>Pickup</b> location</p> : !dropoff ? <p>Set <b>Destination</b></p> : <p>Route optimized</p>)}
            </div>

            <style jsx global>{`
                .car-wrapper { transition: all 1s linear; }
                .marker-pin { width: 12px; height: 12px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.5); }
                .pickup-pin { background: var(--primary); }
                .dropoff-pin { background: #ff4d4d; }
                .rider-dot { width: 14px; height: 14px; background: #00F0FF; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 15px rgba(0, 240, 255, 0.6); position: relative; }
                .rider-dot::after { content: ''; position: absolute; top: -10px; left: -10px; right: -10px; bottom: -10px; border-radius: 50%; background: rgba(0, 240, 255, 0.2); animation: pulse-dot 2s infinite; }
                @keyframes pulse-dot { 0% { transform: scale(0.5); opacity: 1; } 100% { transform: scale(2); opacity: 0; } }
                .leaflet-container { background: #1a1a1a !important; }
                .car-wrapper { transition: all 0.5s linear; }
            `}</style>

            <style jsx>{`
                .map-wrapper { height: 450px; width: 100%; position: relative; overflow: hidden; border-radius: 24px; box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
                .map-overlay { position: absolute; top: 20px; left: 50%; transform: translateX(-50%); z-index: 1000; background: rgba(0,0,0,0.85); padding: 10px 20px; border-radius: 100px; font-size: 0.85rem; color: white; border: 1px solid var(--glass-border); backdrop-filter: blur(10px); }
                .tracking-status { display: flex; align-items: center; gap: 10px; }
                .pulse-mini { width: 8px; height: 8px; background: var(--primary); border-radius: 50%; animation: pulse-mini 1.5s infinite; }
                @keyframes pulse-mini { 0% { transform: scale(1); opacity: 1; } 100% { transform: scale(2.5); opacity: 0; } }
                b { color: var(--primary); }
            `}</style>
        </div >
    );
}
