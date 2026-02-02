'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Car, MapPin, Navigation, Clock, User, LogOut, Search, Plus, List, Star, Zap, TrendingUp, MessageCircle, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import dynamic from 'next/dynamic';

function RatingStars({ onSubmit }: { onSubmit: (score: number, comment: string) => void }) {
    const [score, setScore] = useState(0);
    const [comment, setComment] = useState('');

    return (
        <div className="stars-wrapper">
            <div className="star-row">
                {[1, 2, 3, 4, 5].map(s => (
                    <Star
                        key={s}
                        size={32}
                        fill={s <= score ? "var(--primary)" : "none"}
                        color={s <= score ? "var(--primary)" : "var(--muted)"}
                        onClick={() => setScore(s)}
                        style={{ cursor: 'pointer' }}
                    />
                ))}
            </div>
            <textarea
                placeholder="Write a review..."
                value={comment}
                onChange={e => setComment(e.target.value)}
                className="glass-input"
                style={{ width: '100%', marginTop: '20px', minHeight: '80px', padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white' }}
            />
            <button
                onClick={() => onSubmit(score, comment)}
                className="premium-button full-width"
                style={{ marginTop: '20px' }}
                disabled={score === 0}
            >
                Submit Review
            </button>
            <style jsx>{`
                .star-row { display: flex; gap: 8px; justify-content: center; }
                .glass-input:focus { outline: none; border-color: var(--primary); }
            `}</style>
        </div>
    );
}

const MapComponent = dynamic(() => import('@/components/MapComponent'), {
    ssr: false,
    loading: () => <div className="glass map-loading">Loading Map...</div>
});

const ChatWindow = dynamic(() => import('@/components/ChatWindow'), {
    ssr: false
});

interface Ride {
    id: number;
    riderId: number;
    rider: { username: string };
    pickupAddress: string;
    dropoffAddress: string;
    pickupLatitude: number;
    pickupLongitude: number;
    dropoffLatitude: number;
    dropoffLongitude: number;
    offeredFare: number;
    status: string;
    createdAt: string;
    distanceKm?: number;
    suggestedMinFare?: number;
    suggestedMaxFare?: number;
    vehicleType?: string;
}

interface RideOffer {
    id: number;
    rideId: number;
    driverId: number;
    driver: { username: string };
    fareAmount: number;
    status: string;
}

interface UserLocation {
    userId: number;
    role: string;
    lat: number;
    lng: number;
}

export default function Dashboard() {
    const [mounted, setMounted] = useState(false);
    const [role, setRole] = useState<string | null>(null);
    const [username, setUsername] = useState<string | null>(null);
    const [view, setView] = useState<'main' | 'history' | 'ratings' | 'admin' | 'wallet'>('main');
    const [userId, setUserId] = useState<number | null>(null);
    const [liveUsers, setLiveUsers] = useState<Record<number, UserLocation>>({});
    const [walletBalance, setWalletBalance] = useState<number>(0);
    const [earnings, setEarnings] = useState<{ today: number, total: number, completedToday: number } | null>(null);
    const [showChat, setShowChat] = useState(false);
    const [activeRideId, setActiveRideId] = useState<number | null>(null);
    const router = useRouter();

    useEffect(() => {
        setMounted(true);
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/auth/login');
            return;
        }

        const currentRole = localStorage.getItem('role');
        setRole(currentRole);
        setUsername(localStorage.getItem('username'));
        setUserId(parseInt(localStorage.getItem('userId') || '0'));

        if (currentRole === 'Admin') setView('admin');

        let connection: any = null;
        let watchId: number | undefined;
        let signalRModule: any = null;

        const startTracking = async () => {
            try {
                signalRModule = await import('@microsoft/signalr');
                connection = new signalRModule.HubConnectionBuilder()
                    .withUrl(`http://localhost:5000/rideHub`, {
                        accessTokenFactory: () => token
                    })
                    .withAutomaticReconnect()
                    .build();

                connection.on('UserLocationUpdated', (uid: number, urole: string, lat: number, lng: number) => {
                    setLiveUsers(prev => ({
                        ...prev,
                        [uid]: { userId: uid, role: urole, lat, lng }
                    }));
                });


                connection.onreconnecting(() => {
                    console.log('SignalR reconnecting...');
                });

                connection.onreconnected(() => {
                    console.log('SignalR reconnected');
                });

                connection.onclose(() => {
                    console.log('SignalR connection closed');
                });

                await connection.start();
                console.log('SignalR connected successfully');

                if ('geolocation' in navigator) {
                    watchId = navigator.geolocation.watchPosition(
                        (pos) => {
                            if (connection && signalRModule && connection.state === signalRModule.HubConnectionState.Connected) {
                                connection.invoke('UpdateLocation', pos.coords.latitude, pos.coords.longitude)
                                    .catch((err: any) => console.error("Error updating location:", err));
                            }
                        },
                        (err) => {
                            let errorMessage = 'Unknown error';
                            switch (err.code) {
                                case 1: errorMessage = 'Permission denied - Please enable location access'; break;
                                case 2: errorMessage = 'Position unavailable - Check your GPS/Network'; break;
                                case 3: errorMessage = 'Timeout - Location request timed out'; break;
                            }
                            console.warn(`Geolocation warning: ${errorMessage} (${err.code}) - ${err.message}`);

                            if (err.code !== 3) {
                                toast.error(`Location Error: ${errorMessage}`);
                            }
                        },
                        {
                            enableHighAccuracy: false,
                            maximumAge: 30000,
                            timeout: 20000
                        }
                    );
                }

                const fetchBalance = async () => {
                    try {
                        const res = await api.get('/payments/balance');
                        setWalletBalance(res.data);
                    } catch (err) { }
                };
                fetchBalance();
            } catch (error) {
                console.error('Error starting tracking:', error);
            }
        };

        startTracking();

        return () => {
            if (watchId !== undefined) {
                navigator.geolocation.clearWatch(watchId);
            }
            if (connection) {
                connection.stop().catch((err: any) => console.error('Error stopping connection:', err));
            }
        };
    }, [router]);

    useEffect(() => {
        if (role === 'Driver') {
            const fetchEarnings = async () => {
                try {
                    const res = await api.get('/rides/earnings');
                    setEarnings(res.data);
                } catch (err) { }
            };
            fetchEarnings();
            const intervalId = setInterval(fetchEarnings, 10000);
            return () => clearInterval(intervalId);
        }
    }, [role]);

    const handleLogout = () => {
        localStorage.clear();
        toast.success('Logged out successfully');
        router.push('/auth/login');
    };

    if (!mounted || !role) return <div className="loading" suppressHydrationWarning>Loading...</div>;

    return (
        <div className="dashboard-container">
            <aside className="sidebar glass">
                <div className="sidebar-brand">
                    <Car size={28} color="var(--primary)" />
                    <span>DriveFlow</span>
                </div>

                <nav className="sidebar-nav">
                    {role === 'Admin' ? (
                        <button className={`nav-item ${view === 'admin' ? 'active' : ''}`} onClick={() => setView('admin')}>
                            <User size={20} /> Admin Panel
                        </button>
                    ) : (
                        <>
                            <button className={`nav-item ${view === 'main' ? 'active' : ''}`} onClick={() => setView('main')}>
                                <MapPin size={20} /> {role === 'Driver' ? 'Requests' : 'Book Ride'}
                            </button>
                            <button className={`nav-item ${view === 'history' ? 'active' : ''}`} onClick={() => setView('history')}>
                                <Clock size={20} /> {role === 'Driver' ? 'Trip History' : 'My Rides'}
                            </button>
                            <button className={`nav-item ${view === 'ratings' ? 'active' : ''}`} onClick={() => setView('ratings')}>
                                <Star size={20} /> My Reviews
                            </button>
                            <button className={`nav-item ${view === 'wallet' ? 'active' : ''}`} onClick={() => setView('wallet')}>
                                <Wallet size={20} /> My Wallet
                            </button>
                        </>
                    )}
                </nav>

                <div className="sidebar-footer">
                    <div className="user-profile">
                        <div className="profile-img grad-primary">{username?.[0]?.toUpperCase()}</div>
                        <div className="profile-info">
                            <p className="p-name">{username}</p>
                            <p className="p-role">{role}</p>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="logout-btn">
                        <LogOut size={18} /> Logout
                    </button>
                </div>
            </aside>


            <main className="main-content">
                <header className="top-header glass">
                    <div className="header-left">
                        <div className="role-badge grad-primary">{role} Mode</div>
                        {role === 'Driver' && <div className="online-status"><div className="pulse"></div> Online</div>}
                    </div>
                    <div className="search-bar">
                        <Search size={18} color="var(--muted)" />
                        <input type="text" placeholder={role === 'Rider' ? "Where to?" : "Searching for requests..."} />
                    </div>
                </header>

                <section className="dashboard-view">
                    {view === 'admin' ? (
                        <AdminStatsView />
                    ) : view === 'main' ? (
                        <>
                            <div className="dashboard-hero">
                                <div className="welcome-section">
                                    <h1>Hello, {username}!</h1>
                                    <p>{role === 'Rider' ? "Your premium ride is just a tap away" : "New ride requests are waiting"}</p>
                                </div>
                                <div className="role-widgets">
                                    {role === 'Rider' ? (
                                        <div className="widget glass">
                                            <Navigation size={20} color="var(--primary)" />
                                            <div>
                                                <p className="w-label">Live Drivers</p>
                                                <p className="w-val">{Object.values(liveUsers).filter(u => u.role === 'Driver').length} Active</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="widget glass">
                                                <Zap size={20} color="var(--primary)" />
                                                <div>
                                                    <p className="w-label">Today's Earnings</p>
                                                    <p className="w-val">Rs. {earnings?.today.toLocaleString() || 0}</p>
                                                </div>
                                            </div>
                                            <div className="widget glass">
                                                <TrendingUp size={20} color="var(--primary)" />
                                                <div>
                                                    <p className="w-label">Total Earnings</p>
                                                    <p className="w-val">Rs. {earnings?.total.toLocaleString() || 0}</p>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="action-area">
                                {role === 'Rider' ?
                                    <RiderActionView liveUsers={liveUsers} currentUserId={userId} onToggleChat={() => setShowChat(!showChat)} onRideAccepted={setActiveRideId} /> :
                                    <DriverActionView liveUsers={liveUsers} currentUserId={userId} onToggleChat={() => setShowChat(!showChat)} onRideAccepted={setActiveRideId} />
                                }
                            </div>
                        </>
                    ) : view === 'history' ? (
                        <HistoryView role={role} />
                    ) : view === 'ratings' ? (
                        <RatingsView userId={userId} />
                    ) : (
                        <WalletView balance={walletBalance} onUpdate={setWalletBalance} role={role} />
                    )}
                </section>

                {showChat && activeRideId && userId && (
                    <ChatWindow
                        rideId={activeRideId}
                        currentUserId={userId}
                        onClose={() => setShowChat(false)}
                        token={localStorage.getItem('token') || ''}
                    />
                )}
            </main>

            <style jsx>{`
                .dashboard-container { display: flex; height: 100vh; background: #050505; }
                .sidebar { width: 280px; height: 100%; display: flex; flex-direction: column; padding: 32px; border-right: 1px solid var(--glass-border); }
                .sidebar-brand { display: flex; align-items: center; gap: 12px; font-size: 1.5rem; font-weight: 700; margin-bottom: 48px; }
                .sidebar-nav { display: flex; flex-direction: column; gap: 8px; flex: 1; }
                .nav-item { background: transparent; color: var(--muted); width: 100%; text-align: left; padding: 14px 16px; border-radius: 12px; display: flex; align-items: center; gap: 12px; font-size: 1rem; }
                .nav-item.active { background: var(--glass); color: var(--primary); border: 1px solid var(--glass-border); }
                .sidebar-footer { margin-top: 40px; border-top: 1px solid var(--glass-border); padding-top: 24px; }
                .user-profile { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
                .profile-img { width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #000; font-weight: 700; }

                .top-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 40px; border-bottom: 1px solid var(--glass-border); }
                .header-left { display: flex; align-items: center; gap: 20px; }
                .role-badge { padding: 4px 12px; border-radius: 8px; font-size: 0.75rem; font-weight: 700; color: #000; text-transform: uppercase; }
                .online-status { display: flex; align-items: center; gap: 8px; font-size: 0.85rem; color: var(--primary); font-weight: 600; }
                .pulse { width: 8px; height: 8px; background: var(--primary); border-radius: 50%; box-shadow: 0 0 10px var(--primary); animation: glow 1.5s infinite; }
                @keyframes glow { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }

                .dashboard-hero { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; }
                .role-widgets { display: flex; gap: 20px; }
                .widget { padding: 16px 24px; display: flex; align-items: center; gap: 16px; min-width: 200px; }
                .w-label { font-size: 0.75rem; color: var(--muted); text-transform: uppercase; margin: 0; }
                .w-val { font-size: 1.25rem; font-weight: 800; color: white; margin: 0; }
                .p-name { font-weight: 600; }
                .p-role { font-size: 0.8rem; color: var(--muted); }
                .logout-btn { width: 100%; background: transparent; color: var(--error); padding: 12px; display: flex; align-items: center; justify-content: center; gap: 8px; border: 1px solid rgba(255, 77, 77, 0.1); border-radius: 10px; }
                .main-content { flex: 1; display: flex; flex-direction: column; overflow-y: auto; background: radial-gradient(circle at top right, #1a1a1a 0%, #050505 100%); }
                .top-header { height: 80px; padding: 0 40px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--glass-border); position: sticky; top: 0; z-index: 50; }
                .search-bar { display: flex; align-items: center; gap: 12px; background: var(--secondary); padding: 10px 16px; border-radius: 12px; width: 400px; }
                .dashboard-view { padding: 40px; max-width: 1200px; margin: 0 auto; width: 100%; }
                .welcome-section h1 { font-size: 2.5rem; margin-bottom: 8px; }
                .welcome-section p { color: var(--muted); font-size: 1.1rem; margin-bottom: 40px; }
                .loading { display: flex; align-items: center; justify-content: center; height: 100vh; font-size: 1.2rem; }
                .map-loading { height: 400px; display: flex; align-items: center; justify-content: center; border-radius: 20px; }
            `}</style>
        </div>
    );
}

function RiderActionView({ liveUsers, currentUserId, onToggleChat, onRideAccepted }: {
    liveUsers: Record<number, UserLocation>,
    currentUserId: number | null,
    onToggleChat: () => void,
    onRideAccepted: (id: number | null) => void
}) {
    const [pickup, setPickup] = useState('');
    const [dropoff, setDropoff] = useState('');
    const [coords, setCoords] = useState<{ p: [number, number], d: [number, number], dist: number } | null>(null);
    const [extPickup, setExtPickup] = useState<[number, number] | null>(null);
    const [extDropoff, setExtDropoff] = useState<[number, number] | null>(null);
    const [offer, setOffer] = useState('');
    const [aiInfo, setAiInfo] = useState<{ min: number, max: number, suggested: number } | null>(null);
    const [loading, setLoading] = useState(false);
    const [activeRide, setActiveRide] = useState<Ride | null>(null);
    const [offers, setOffers] = useState<RideOffer[]>([]);
    const [acceptedRide, setAcceptedRide] = useState<any>(null);
    const [selectedVehicle, setSelectedVehicle] = useState<'Bike' | 'Car' | 'AC Car'>('Car');
    const mapSelectRef = useRef(false);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (pickup.length > 3 && !mapSelectRef.current) {
                try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(pickup)}`);
                    const data = await res.json();
                    if (data && data[0]) {
                        const newP: [number, number] = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
                        setExtPickup(newP);
                        if (coords?.d) {
                            const d = calculateDistance(newP, coords.d);
                            setCoords({ p: newP, d: coords.d, dist: d });
                        } else {
                            setCoords(c => c ? { ...c, p: newP } : null);
                        }
                    }
                } catch (e) { }
            }
        }, 1500);
        return () => clearTimeout(timer);
    }, [pickup]);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (dropoff.length > 3 && !mapSelectRef.current) {
                try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(dropoff)}`);
                    const data = await res.json();
                    if (data && data[0]) {
                        const newD: [number, number] = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
                        setExtDropoff(newD);
                        if (coords?.p) {
                            const d = calculateDistance(coords.p, newD);
                            setCoords({ p: coords.p, d: newD, dist: d });
                        } else {
                            setCoords(c => c ? { ...c, d: newD } : null);
                        }
                    }
                } catch (e) { }
            }
        }, 1500);
        return () => clearTimeout(timer);
    }, [dropoff]);

    const calculateDistance = (p1: [number, number], p2: [number, number]) => {
        const R = 6371;
        const dLat = (p2[0] - p1[0]) * Math.PI / 180;
        const dLon = (p2[1] - p1[1]) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(p1[0] * Math.PI / 180) * Math.cos(p2[0] * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    const handleMapPickup = async (lat: number, lng: number) => {
        mapSelectRef.current = true;
        setExtPickup([lat, lng]);
        if (extDropoff) {
            setCoords({ p: [lat, lng], d: extDropoff, dist: calculateDistance([lat, lng], extDropoff) });
        }

        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            const data = await res.json();
            setPickup(data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        } catch (e) {
            setPickup(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        }
        setTimeout(() => mapSelectRef.current = false, 2000);
    };

    const handleMapDropoff = async (lat: number, lng: number) => {
        mapSelectRef.current = true;
        setExtDropoff([lat, lng]);
        if (extPickup) {
            setCoords({ p: extPickup, d: [lat, lng], dist: calculateDistance(extPickup, [lat, lng]) });
        }

        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            const data = await res.json();
            setDropoff(data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        } catch (e) {
            setDropoff(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        }
        setTimeout(() => mapSelectRef.current = false, 2000);
    };

    useEffect(() => {
        const getAiSuggestion = async () => {
            if (coords) {
                try {
                    const res = await api.get(`/rides/fare-suggestion?distanceKm=${coords.dist}&vehicleType=${selectedVehicle}`);
                    const data = res.data;
                    setAiInfo({
                        min: data.minFare,
                        max: data.maxFare,
                        suggested: Math.floor((data.minFare + data.maxFare) / 2)
                    });
                } catch (err) {

                    const rates: Record<string, number> = { 'Bike': 40, 'Car': 60, 'AC Car': 100 };
                    const baseFares: Record<string, number> = { 'Bike': 50, 'Car': 100, 'AC Car': 150 };

                    const base = baseFares[selectedVehicle] || 100;
                    const rate = rates[selectedVehicle] || 60;

                    const est = (base + (coords.dist * rate));
                    setAiInfo({
                        min: Math.floor(est * 0.9),
                        max: Math.floor(est * 1.2),
                        suggested: Math.floor(est)
                    });
                }
            }
        };
        getAiSuggestion();
    }, [coords, selectedVehicle]);

    const postRide = async () => {
        if (!coords) return;
        setLoading(true);
        try {
            const res = await api.post('/rides', {
                pickupAddress: pickup,
                dropoffAddress: dropoff,
                offeredFare: parseFloat(offer),
                pickupLatitude: coords.p[0],
                pickupLongitude: coords.p[1],
                dropoffLatitude: coords.d[0],
                dropoffLongitude: coords.d[1],
                distanceKm: coords.dist,
                vehicleType: selectedVehicle
            });
            setActiveRide(res.data);
            toast.success('Ride request posted!');
        } catch (err: any) {
            toast.error(err.response?.data || 'Failed to post ride');
        } finally {
            setLoading(false);
        }
    };

    const fetchOffers = async () => {
        if (!activeRide) return;
        try {
            const res = await api.get(`/rides/${activeRide.id}/offers`);
            setOffers(res.data);
        } catch (err) { }
    };

    const acceptOffer = async (o: RideOffer) => {
        try {
            await api.post(`/rides/${activeRide?.id}/offers/${o.id}/accept`);
            toast.success('Driver accepted! Your ride is on the way.');

            setAcceptedRide({
                pickup: [activeRide?.pickupLatitude, activeRide?.pickupLongitude],
                dropoff: [activeRide?.dropoffLatitude, activeRide?.dropoffLongitude],
                status: 'Accepted',
                driverName: o.driver.username,
                driverId: o.driverId,
                fare: o.fareAmount,
                id: activeRide?.id
            });

            const rideId = activeRide?.id;
            setActiveRide(null);
            setOffers([]);
            onRideAccepted(rideId || null);
        } catch (err) {
            toast.error('Failed to accept offer');
        }
    };

    useEffect(() => {
        let interval: any;
        if (activeRide) {
            interval = setInterval(fetchOffers, 3000);
        }
        return () => clearInterval(interval);
    }, [activeRide]);

    useEffect(() => {
        let interval: any;
        if (acceptedRide?.id && acceptedRide.status !== 'Completed') {
            interval = setInterval(async () => {
                try {
                    const res = await api.get(`/rides/${acceptedRide.id}`);
                    if (res.data.status === 'Completed') {
                        setAcceptedRide((prev: any) => ({ ...prev, status: 'Completed', paid: false }));
                        toast.success('Destination reached!');
                    }
                } catch (e) { }
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [acceptedRide]);

    const submitRating = async (score: number, comment: string) => {
        try {
            await api.post('/ratings', {
                rideId: acceptedRide.id,
                score,
                comment
            });
            toast.success('Rating submitted!');
            setAcceptedRide(null);
        } catch (err) {
            toast.error('Failed to submit rating');
        }
    };

    const handlePayment = async () => {
        try {
            await api.post(`/payments/transfer-for-ride/${acceptedRide.id}`);
            setAcceptedRide((prev: any) => ({ ...prev, paid: true }));
            toast.success('Payment successful!');
        } catch (err: any) {
            toast.error(err.response?.data || 'Payment failed');
        }
    };

    if (acceptedRide) {
        if (acceptedRide.status === 'Completed') {
            return (
                <div className="rider-action-view">
                    <div className="map-section">
                        <MapComponent trackingRide={acceptedRide} liveUsers={liveUsers} currentUserId={currentUserId} />
                    </div>
                    <div className="premium-card glass request-card">
                        {!acceptedRide.paid ? (
                            <>
                                <div className="card-header" style={{ justifyContent: 'center' }}>
                                    <Wallet size={32} color="var(--primary)" />
                                    <h3>Ride Payment</h3>
                                </div>
                                <div className="payment-form" style={{ textAlign: 'center' }}>
                                    <p style={{ color: 'var(--muted)', marginBottom: '12px' }}>Trip with {acceptedRide.driverName} is finished.</p>
                                    <div className="fare-display" style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '24px' }}>
                                        Rs. {acceptedRide.fare}
                                    </div>
                                    <button onClick={handlePayment} className="premium-button full-width">Pay from Wallet</button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="card-header" style={{ justifyContent: 'center' }}>
                                    <Star size={32} color="var(--primary)" />
                                    <h3>Rate Your Ride</h3>
                                </div>
                                <div className="rating-form" style={{ textAlign: 'center' }}>
                                    <p style={{ color: 'var(--muted)', marginBottom: '24px' }}>How was your ride with {acceptedRide.driverName}?</p>
                                    <RatingStars onSubmit={(score, comment) => submitRating(score, comment)} />
                                </div>
                            </>
                        )}
                    </div>
                </div>
            );
        }

        return (
            <div className="rider-action-view">
                <div className="map-section">
                    <MapComponent trackingRide={acceptedRide} liveUsers={liveUsers} currentUserId={currentUserId} />
                </div>
                <div className="premium-card glass request-card">
                    <div className="card-header">
                        <Car size={24} color="var(--primary)" />
                        <h3>Ride in Progress</h3>
                    </div>
                    <div className="driver-details glass">
                        <div className="driver-info">
                            <div className="driver-avatar grad-primary">{acceptedRide.driverName[0]}</div>
                            <div>
                                <h4>{acceptedRide.driverName}</h4>
                                <p>Arriving in ~5 mins</p>
                            </div>
                        </div>
                        <div className="fare-tag grad-primary">Rs. {acceptedRide.fare}</div>
                    </div>
                    <div className="action-buttons-row">
                        <button onClick={onToggleChat} className="premium-button flex-1" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)' }}>
                            <MessageCircle size={18} /> Chat
                        </button>
                        <button onClick={() => { setAcceptedRide(null); onRideAccepted(null); }} className="premium-button flex-1 outline">Cancel Ride</button>
                    </div>
                </div>
                <style jsx>{`
                    .rider-action-view { display: grid; grid-template-columns: 1fr 400px; gap: 32px; align-items: start; }
                    .driver-details { padding: 20px; display: flex; align-items: center; justify-content: space-between; border-radius: 12px; margin-bottom: 20px; }
                    .driver-info { display: flex; align-items: center; gap: 12px; }
                    .driver-avatar { width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: black; font-weight: 700; }
                    .fare-tag { padding: 8px 16px; border-radius: 100px; font-weight: 700; color: black; }
                    .action-buttons-row { display: flex; gap: 12px; }
                    .flex-1 { flex: 1; }
                    .outline { background: transparent; border: 1px solid var(--error); color: var(--error); }
                    @media (max-width: 1000px) { .rider-action-view { grid-template-columns: 1fr; } }
                `}</style>
            </div>
        );
    }

    if (activeRide) {
        return (
            <div className="rider-action-view">
                <div className="map-section">
                    <MapComponent
                        trackingRide={{ pickup: [activeRide.pickupLatitude, activeRide.pickupLongitude], dropoff: [activeRide.dropoffLatitude, activeRide.dropoffLongitude], status: 'Searching' }}
                        liveUsers={liveUsers}
                        currentUserId={currentUserId}
                    />
                </div>
                <div className="premium-card glass request-card">
                    <div className="status-header">
                        <div className="pulse-container">
                            <div className="pulse-circle"></div>
                            <Search size={24} color="var(--primary)" />
                        </div>
                        <h3>Searching for Drivers...</h3>
                    </div>

                    <div className="route-preview glass">
                        <div className="loc"><MapPin size={14} /> {activeRide.pickupAddress}</div>
                        <div className="loc"><Navigation size={14} /> {activeRide.dropoffAddress}</div>
                        <div className="fare-tag">Offered: Rs. {activeRide.offeredFare}</div>
                    </div>

                    <div className="offers-list">
                        <h4>Offers ({offers.length})</h4>
                        {offers.length === 0 ? (
                            <p className="no-offers">Please wait while we find nearby drivers...</p>
                        ) : (
                            <div className="offers-scroll">
                                {offers.map(o => (
                                    <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} key={o.id} className="offer-card glass">
                                        <div className="driver-info">
                                            <div className="driver-avatar grad-primary">{o.driver.username[0]}</div>
                                            <div>
                                                <h5>{o.driver.username}</h5>
                                                <p>4.8 ★ Rating</p>
                                            </div>
                                        </div>
                                        <div className="offer-actions">
                                            <div className="offer-price">Rs. {o.fareAmount}</div>
                                            <button onClick={() => acceptOffer(o)} className="premium-button small">Accept</button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                    <button onClick={() => setActiveRide(null)} className="premium-button full-width outline" style={{ marginTop: '20px' }}>Cancel Request</button>
                </div>

                <style jsx>{`
                    .rider-action-view { display: grid; grid-template-columns: 1fr 400px; gap: 32px; align-items: start; }
                    .status-header { text-align: center; margin-bottom: 24px; }
                    .pulse-container { position: relative; width: 60px; height: 60px; margin: 0 auto 12px; display: flex; align-items: center; justify-content: center; }
                    .pulse-circle { position: absolute; width: 100%; height: 100%; border-radius: 50%; background: var(--primary); opacity: 0.2; animation: pulse 2s infinite; }
                    @keyframes pulse { 0% { transform: scale(1); opacity: 0.2; } 100% { transform: scale(1.8); opacity: 0; } }
                    
                    .route-preview { padding: 16px; border-radius: 12px; margin-bottom: 24px; }
                    .loc { display: flex; align-items: center; gap: 8px; font-size: 0.85rem; color: var(--muted); margin-bottom: 8px; }
                    .fare-tag { display: inline-block; padding: 4px 12px; background: var(--primary); color: black; border-radius: 100px; font-weight: 700; font-size: 0.8rem; margin-top: 8px; }
                    
                    .offers-list h4 { margin-bottom: 16px; font-size: 1rem; }
                    .offers-scroll { max-height: 300px; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; }
                    .offer-card { padding: 16px; display: flex; align-items: center; justify-content: space-between; }
                    .driver-info { display: flex; align-items: center; gap: 10px; }
                    .driver-avatar { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: black; font-weight: 700; font-size: 0.8rem; }
                    .offer-actions { text-align: right; }
                    .offer-price { font-weight: 700; color: var(--primary); margin-bottom: 4px; }
                    .no-offers { color: var(--muted); font-size: 0.9rem; text-align: center; padding: 20px; }
                    .outline { background: transparent; border: 1px solid var(--error); color: var(--error); }
                    @media (max-width: 1000px) { .rider-action-view { grid-template-columns: 1fr; } }
                `}</style>
            </div>
        );
    }

    return (
        <div className="rider-action-view">
            <div className="map-section">
                <MapComponent
                    externalPickup={extPickup}
                    externalDropoff={extDropoff}
                    onLocationSelect={(p, d, dist) => setCoords({ p, d, dist })}
                    liveUsers={liveUsers}
                    onPickupSelect={handleMapPickup}
                    onDropoffSelect={handleMapDropoff}
                    currentUserId={currentUserId}
                />
            </div>

            <div className="premium-card glass request-card">
                <div className="card-header">
                    <Plus size={24} color="var(--primary)" />
                    <h3>Request Details</h3>
                </div>
                <div className="request-form">
                    <div className="input-group">
                        <MapPin size={18} className="input-icon" />
                        <input type="text" placeholder="Pickup address name" value={pickup} onChange={(e) => setPickup(e.target.value)} />
                    </div>
                    <div className="input-group">
                        <Navigation size={18} className="input-icon" />
                        <input type="text" placeholder="Destination address name" value={dropoff} onChange={(e) => setDropoff(e.target.value)} />
                    </div>

                    {aiInfo && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="ai-suggestion-box glass">
                            <div className="ai-header">
                                <Zap size={14} color="var(--primary)" />
                                <span>AI Recommended Fare</span>
                            </div>
                            <div className="ai-prices">
                                <div className="p-item">
                                    <small>Suggested</small>
                                    <p>Rs. {aiInfo.suggested}</p>
                                </div>
                                <div className="p-divider"></div>
                                <div className="p-item">
                                    <small>Range</small>
                                    <p>Rs. {aiInfo.min} - {aiInfo.max}</p>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    <div className="vehicle-selector">
                        {[
                            { id: 'Bike', icon: <Zap size={18} />, label: 'Bike' },
                            { id: 'Car', icon: <Car size={18} />, label: 'Car' },
                            { id: 'AC Car', icon: <Zap size={18} />, label: 'AC Car' }
                        ].map(v => (
                            <button
                                key={v.id}
                                className={`v-option glass ${selectedVehicle === v.id ? 'active' : ''}`}
                                onClick={() => setSelectedVehicle(v.id as any)}
                            >
                                {v.icon}
                                <span>{v.label}</span>
                            </button>
                        ))}
                    </div>

                    <div className="input-group">
                        <span className="input-icon">Rs.</span>
                        <input type="number" placeholder="Enter your offer" value={offer} onChange={(e) => setOffer(e.target.value)} />
                    </div>

                    {coords && <p className="dist-estimate">Route Distance: {coords.dist.toFixed(2)} km</p>}

                    <button onClick={postRide} className="premium-button full-width" disabled={loading || !pickup || !dropoff || !offer || !coords}>
                        {loading ? 'Posting...' : 'Post Request'}
                    </button>
                </div>
            </div>

            <style jsx>{`
                .rider-action-view { display: grid; grid-template-columns: 1fr 400px; gap: 32px; align-items: start; }
                .request-card { padding: 32px; }
                .card-header { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
                .request-form { display: flex; flex-direction: column; gap: 20px; }
                .input-group { position: relative; }
                .input-icon { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: var(--muted); }
                .input-group input { width: 100%; padding-left: 48px; }
                .full-width { width: 100%; }
                .dist-estimate { font-size: 0.9rem; color: var(--muted); text-align: center; }
                
                .ai-suggestion-box { padding: 16px; border-radius: 12px; background: rgba(193, 255, 0, 0.05); border: 1px solid rgba(193, 255, 0, 0.2); }
                .ai-header { display: flex; align-items: center; gap: 8px; font-size: 0.75rem; color: var(--primary); font-weight: 700; text-transform: uppercase; margin-bottom: 12px; }
                .ai-prices { display: flex; justify-content: space-between; align-items: center; }
                .p-item small { font-size: 0.7rem; color: var(--muted); }
                .p-item p { font-size: 1rem; font-weight: 700; margin:0; }
                .p-divider { width: 1px; height: 30px; background: var(--glass-border); }

                .vehicle-selector { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 8px; }
                .v-option { padding: 12px; display: flex; flex-direction: column; align-items: center; gap: 8px; border-radius: 12px; transition: all 0.3s ease; border: 1px solid var(--glass-border); background: transparent; color: var(--muted); }
                .v-option.active { border-color: var(--primary); color: var(--primary); background: rgba(193, 255, 0, 0.05); }
                .v-option span { font-size: 0.75rem; font-weight: 600; }

                @media (max-width: 1000px) {
                    .rider-action-view { grid-template-columns: 1fr; }
                }
            `}</style>
        </div>
    );
}

function DriverActionView({ liveUsers, currentUserId, onToggleChat, onRideAccepted }: {
    liveUsers: Record<number, UserLocation>,
    currentUserId: number | null,
    onToggleChat: () => void,
    onRideAccepted: (id: number | null) => void
}) {
    const [rides, setRides] = useState<Ride[]>([]);
    const [activeRide, setActiveRide] = useState<Ride | null>(null);
    const [loading, setLoading] = useState(true);
    const [showOfferModal, setShowOfferModal] = useState<number | null>(null);
    const [counterFare, setCounterFare] = useState('');

    const fetchRides = async () => {
        try {
            const res = await api.get('/rides/available');
            setRides(res.data);

            const myRides = await api.get('/rides/my-rides');
            const active = (myRides.data as Ride[]).find(r => r.status === 'Accepted');
            setActiveRide(active || null);
            onRideAccepted(active?.id || null);
        } catch (err) {
            toast.error('Failed to load rides');
        } finally {
            setLoading(false);
        }
    };

    const completeRide = async (id: number) => {
        try {
            await api.post(`/rides/${id}/complete`);
            toast.success('Trip completed! Waiting for next ride.');
            setActiveRide(null);
            onRideAccepted(null);
            fetchRides();
        } catch (err) {
            toast.error('Failed to complete ride');
        }
    };

    const makeOffer = async (rideId: number) => {
        try {
            await api.post(`/rides/${rideId}/offer`, { fareAmount: parseFloat(counterFare) });
            toast.success('Offer sent to rider!');
            setShowOfferModal(null);
            setCounterFare('');
            fetchRides();
        } catch (err) {
            toast.error('Failed to send offer');
        }
    };

    useEffect(() => {
        fetchRides();
        const interval = setInterval(fetchRides, 2500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="driver-action-view">
            <div className="map-section">
                <MapComponent
                    liveUsers={liveUsers}
                    trackingRide={activeRide ? { pickup: [activeRide.pickupLatitude, activeRide.pickupLongitude], dropoff: [activeRide.dropoffLatitude, activeRide.dropoffLongitude], status: 'Accepted' } : null}
                    currentUserId={currentUserId}
                />
            </div>
            <div className="requests-section">
                {activeRide && (
                    <div className="premium-card glass active-trip-card" style={{ marginBottom: '32px', border: '1px solid var(--primary)' }}>
                        <div className="card-header">
                            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 4, ease: "linear" }}>
                                <Car size={24} color="var(--primary)" />
                            </motion.div>
                            <h3>Current Active Trip</h3>
                        </div>
                        <div className="trip-details">
                            <div className="loc-group">
                                <div className="loc"><MapPin size={16} color="var(--primary)" /> <span>{activeRide.pickupAddress}</span></div>
                                <div className="loc-line"></div>
                                <div className="loc"><Search size={16} color="#ff4d4d" /> <span>{activeRide.dropoffAddress}</span></div>
                            </div>
                            <div className="trip-footer">
                                <div className="fare-badge">Rs. {activeRide.offeredFare}</div>
                                <div className="action-buttons-row" style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                                    <button onClick={onToggleChat} className="premium-button flex-1" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)' }}>
                                        <MessageCircle size={18} />
                                        <span>Chat with Rider</span>
                                    </button>
                                    <button onClick={() => completeRide(activeRide.id)} className="premium-button flex-1">Complete Trip</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="premium-card glass list-card">
                    <div className="card-header">
                        <List size={24} color="var(--primary)" />
                        <h3>Available Ride Requests</h3>
                    </div>
                    {loading ? <p>Updating rides...</p> : (
                        <div className="rides-list">
                            {rides.length === 0 ? (
                                <div className="empty-state">
                                    <Car size={48} color="var(--muted)" opacity={0.2} />
                                    <p>No active ride requests in your area</p>
                                </div>
                            ) : (
                                rides.map(r => (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        key={r.id}
                                        className="ride-req-card glass"
                                    >
                                        <div className="req-header">
                                            <div className=" rider-meta">
                                                <div className="profile-img grad-primary">{r.rider.username[0]}</div>
                                                <span>{r.rider.username}</span>
                                            </div>
                                            <div className="req-fare">Rs. {r.offeredFare}</div>
                                        </div>
                                        <div className="req-body">
                                            <div className="loc"><MapPin size={14} /> {r.pickupAddress}</div>
                                            <div className="loc"><Navigation size={14} /> {r.dropoffAddress}</div>
                                            <div className="req-meta-row">
                                                {r.distanceKm && <div className="loc"><Clock size={14} /> {r.distanceKm.toFixed(1)} km</div>}
                                                {r.vehicleType && (
                                                    <div className={`v-badge ${r.vehicleType.toLowerCase().replace(' ', '-')}`}>
                                                        {r.vehicleType === 'Bike' ? <Zap size={10} /> : <Car size={10} />}
                                                        <span>{r.vehicleType}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="req-footer">
                                            <button onClick={() => { setShowOfferModal(r.id); setCounterFare(r.offeredFare.toString()); }} className="premium-button small">Make Offer</button>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {showOfferModal && (
                    <div className="modal-overlay" onClick={() => setShowOfferModal(null)}>
                        <div className="modal-content glass" onClick={e => e.stopPropagation()}>
                            <h3>Make an Offer</h3>
                            <p>Rider Offered: Rs. {rides.find(r => r.id === showOfferModal)?.offeredFare}</p>
                            <div className="input-group">
                                <span className="input-icon">Rs.</span>
                                <input type="number" value={counterFare} onChange={e => setCounterFare(e.target.value)} />
                            </div>
                            <div className="modal-actions">
                                <button onClick={() => setShowOfferModal(null)} className="secondary-button">Cancel</button>
                                <button onClick={() => makeOffer(showOfferModal)} className="premium-button">Send Offer</button>
                            </div>
                        </div>
                    </div>
                )}

                <style jsx>{`
                .driver-action-view { display: grid; grid-template-columns: 1fr 400px; gap: 32px; align-items: start; }
                .list-card { padding: 32px; }
                .card-header { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
                .rides-list { display: flex; flex-direction: column; gap: 16px; }
                .ride-req-card { padding: 24px; transition: all 0.3s ease; }
                .ride-req-card:hover { border-color: var(--primary); transform: translateY(-4px); }
                .req-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
                .rider-meta { display: flex; align-items: center; gap: 10px; }
                .profile-img { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: black; font-weight: bold; font-size: 0.8rem; }
                .req-fare { font-size: 1.2rem; font-weight: 700; color: var(--primary); }
                .req-body { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
                .loc { display: flex; align-items: center; gap: 8px; color: var(--muted); font-size: 0.9rem; }
                .empty-state { text-align: center; padding: 60px 0; color: var(--muted); }
                
                .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); z-index: 1000; display: flex; align-items: center; justify-content: center; }
                .modal-content { width: 400px; padding: 32px; text-align: center; border-radius: 20px; }
                .modal-content h3 { margin-bottom: 8px; }
                .modal-content p { color: var(--muted); margin-bottom: 24px; }
                .modal-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 24px; }
                .secondary-button { background: transparent; border: 1px solid var(--glass-border); color: white; padding: 12px; border-radius: 12px; }

                .active-trip-card { padding: 32px; }
                .loc-group { display: flex; flex-direction: column; gap: 8px; margin-bottom: 24px; position: relative; }
                .loc-line { height: 20px; width: 1px; background: var(--glass-border); margin-left: 8px; border-left: 1px dashed var(--muted); }
                .trip-footer { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--glass-border); padding-top: 24px; }
                .fare-badge { font-size: 1.5rem; font-weight: 800; color: var(--primary); }

                .req-meta-row { display: flex; align-items: center; gap: 12px; margin-top: 4px; }
                .v-badge { display: flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; border: 1px solid var(--glass-border); }
                .v-badge.bike { color: #FFA500; border-color: rgba(255, 165, 0, 0.3); background: rgba(255, 165, 0, 0.05); }
                .v-badge.car { color: var(--primary); border-color: rgba(193, 255, 0, 0.3); background: rgba(193, 255, 0, 0.05); }
                .v-badge.ac-car { color: #00F0FF; border-color: rgba(0, 240, 255, 0.3); background: rgba(0, 240, 255, 0.05); }

                @media (max-width: 1000px) {
                    .driver-action-view { grid-template-columns: 1fr; }
                }
            `}</style>
            </div>
        </div>
    );
}

function HistoryView({ role }: { role: string | null }) {
    const [rides, setRides] = useState<Ride[]>([]);
    const [loading, setLoading] = useState(true);
    const [ratingRide, setRatingRide] = useState<number | null>(null);
    const [ratingScore, setRatingScore] = useState(5);
    const [ratingComment, setRatingComment] = useState('');

    const fetchHistory = async () => {
        try {
            const res = await api.get('/rides/my-rides');
            setRides(res.data);
        } catch (err) {
            toast.error('Failed to load history');
        } finally {
            setLoading(false);
        }
    };

    const submitRating = async () => {
        if (!ratingRide) return;
        try {
            await api.post('/ratings', {
                rideId: ratingRide,
                score: ratingScore,
                comment: ratingComment
            });
            toast.success('Rating submitted!');
            setRatingRide(null);
            setRatingScore(5);
            setRatingComment('');
        } catch (err) {
            toast.error('Failed to submit rating');
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    return (
        <div className="history-view">
            <div className="welcome-section">
                <h1>My Ride History</h1>
                <p>View your past journeys and earnings</p>
            </div>

            <div className="premium-card glass history-card">
                {loading ? <p>Loading history...</p> : (
                    <div className="history-list">
                        {rides.length === 0 ? (
                            <div className="empty-state">
                                <Clock size={48} color="var(--muted)" opacity={0.2} />
                                <p>No rides found in your history</p>
                            </div>
                        ) : (
                            <div className="list-container">
                                {rides.map(r => (
                                    <div key={r.id} className="history-item glass">
                                        <div className="item-main">
                                            <div className="route-info">
                                                <div className="loc-dot pickup"></div>
                                                <p className="loc-text">{r.pickupAddress}</p>
                                                <div className="route-line"></div>
                                                <div className="loc-dot dropoff"></div>
                                                <p className="loc-text">{r.dropoffAddress}</p>
                                            </div>
                                            <div className="ride-meta">
                                                <div className="meta-group">
                                                    <small>Amount</small>
                                                    <p className="text-primary">Rs. {r.offeredFare}</p>
                                                </div>
                                                <div className="meta-group">
                                                    <small>Status</small>
                                                    <span className={`status-badge ${r.status.toLowerCase()}`}>{r.status}</span>
                                                </div>
                                                <div className="meta-group">
                                                    <small>Date</small>
                                                    <p>{new Date(r.createdAt).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            {r.status === 'Completed' && (
                                                <button onClick={() => setRatingRide(r.id)} className="rate-btn">Rate Ride</button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {ratingRide && (
                <div className="modal-overlay" onClick={() => setRatingRide(null)}>
                    <div className="modal-content glass" onClick={e => e.stopPropagation()}>
                        <h3>Rate your Experience</h3>
                        <p>How was your journey?</p>
                        <div className="stars-input">
                            {[1, 2, 3, 4, 5].map(s => (
                                <Star
                                    key={s}
                                    size={32}
                                    onClick={() => setRatingScore(s)}
                                    fill={s <= ratingScore ? 'var(--primary)' : 'none'}
                                    color="var(--primary)"
                                    style={{ cursor: 'pointer' }}
                                />
                            ))}
                        </div>
                        <div className="input-group" style={{ marginTop: '20px' }}>
                            <textarea
                                placeholder="Add a comment (optional)..."
                                value={ratingComment}
                                onChange={e => setRatingComment(e.target.value)}
                                className="glass"
                                style={{ width: '100%', padding: '12px', borderRadius: '12px', minHeight: '80px', border: '1px solid var(--glass-border)', color: 'white' }}
                            />
                        </div>
                        <div className="modal-actions">
                            <button onClick={() => setRatingRide(null)} className="secondary-button">Cancel</button>
                            <button onClick={submitRating} className="premium-button">Submit</button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .stars-input { display: flex; justify-content: center; gap: 8px; margin: 10px 0; }
                .history-card { padding: 32px; }
                .list-container { display: flex; flex-direction: column; gap: 16px; }
                .history-item { padding: 24px; }
                .item-main { display: flex; justify-content: space-between; align-items: center; }
                .route-info { display: flex; flex-direction: column; gap: 4px; position: relative; padding-left: 24px; max-width: 50%; }
                .loc-dot { position: absolute; left: 0; width: 10px; height: 10px; border-radius: 50%; }
                .loc-dot.pickup { top: 6px; background: var(--primary); }
                .loc-dot.dropoff { bottom: 6px; background: #ff4d4d; }
                .route-line { position: absolute; left: 4px; top: 16px; bottom: 16px; width: 2px; background: var(--glass-border); border-style: dashed; }
                .loc-text { font-size: 0.95rem; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                
                .ride-meta { display: flex; gap: 40px; }
                .meta-group small { display: block; color: var(--muted); font-size: 0.75rem; margin-bottom: 4px; text-transform: uppercase; }
                .meta-group p { font-size: 1.1rem; font-weight: 700; margin: 0; }
                
                .status-badge { padding: 4px 12px; border-radius: 100px; font-size: 0.8rem; font-weight: 700; text-transform: uppercase; }
                .status-badge.requested { background: rgba(193, 255, 0, 0.1); color: var(--primary); }
                .status-badge.accepted { background: rgba(0, 150, 255, 0.1); color: #0096ff; }
                .status-badge.completed { background: rgba(0, 255, 128, 0.1); color: #00ff80; }
                
                .empty-state { text-align: center; padding: 60px 0; color: var(--muted); }
                .rate-btn { background: var(--primary); color: black; border: none; padding: 6px 16px; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 0.8rem; margin-top: 8px; }
            `}</style>
        </div>
    );
}

function RatingsView({ userId }: { userId: number | null }) {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRatings = async () => {
            if (!userId) return;
            try {
                const res = await api.get(`/ratings/user/${userId}`);
                setStats(res.data);
            } catch (err) {
                toast.error('Failed to load ratings');
            } finally {
                setLoading(false);
            }
        };
        fetchRatings();
    }, [userId]);

    return (
        <div className="ratings-view">
            <div className="welcome-section">
                <h1>Ratings & Feedback</h1>
                <p>See what others have to say about your service</p>
            </div>

            {loading ? <p>Loading feedback...</p> : (
                <div className="ratings-grid">
                    <div className="premium-card glass stats-card">
                        <div className="avg-big">{stats?.averageScore?.toFixed(1) || '0.0'}</div>
                        <div className="stars">
                            {[1, 2, 3, 4, 5].map(s => (
                                <Star key={s} size={20} fill={s <= Math.round(stats?.averageScore || 0) ? 'var(--primary)' : 'none'} color="var(--primary)" />
                            ))}
                        </div>
                        <p>{stats?.count || 0} Total Reviews</p>
                    </div>

                    <div className="reviews-list">
                        {stats?.reviews?.length === 0 ? (
                            <p className="no-reviews">No reviews yet. Complete more rides to get feedback!</p>
                        ) : (
                            stats?.reviews?.map((r: any) => (
                                <div key={r.id} className="review-item glass">
                                    <div className="review-header">
                                        <div className="stars-small">
                                            {[1, 2, 3, 4, 5].map(s => (
                                                <Star key={s} size={12} fill={s <= r.score ? 'var(--primary)' : 'none'} color="var(--primary)" />
                                            ))}
                                        </div>
                                        <small>{new Date(r.createdAt).toLocaleDateString()}</small>
                                    </div>
                                    <p className="review-comment">&quot;{r.comment}&quot;</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            <style jsx>{`
                .ratings-grid { display: grid; grid-template-columns: 300px 1fr; gap: 32px; }
                .stats-card { padding: 40px; text-align: center; height: fit-content; }
                .avg-big { font-size: 4rem; font-weight: 800; color: var(--primary); line-height: 1; margin-bottom: 12px; }
                .stars { display: flex; justify-content: center; gap: 4px; margin-bottom: 12px; }
                .reviews-list { display: flex; flex-direction: column; gap: 16px; }
                .review-item { padding: 20px; }
                .review-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
                .stars-small { display: flex; gap: 2px; }
                .review-comment { font-style: italic; color: var(--muted); line-height: 1.5; }
                .no-reviews { text-align: center; color: var(--muted); padding: 40px; }
            `}</style>
        </div>
    );
}

function AdminStatsView() {
    const [stats, setStats] = useState<any>(null);
    const [recentRides, setRecentRides] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const [statsRes, ridesRes] = await Promise.all([
                api.get('/admin/stats'),
                api.get('/admin/recent-rides')
            ]);
            setStats(statsRes.data);
            setRecentRides(ridesRes.data);
        } catch (err) {
            toast.error('Failed to load admin data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    if (loading) return <p>Loading Admin Dashboard...</p>;

    return (
        <div className="admin-view">
            <div className="welcome-section">
                <h1>Platform Overview</h1>
                <p>Monitor your fleet and earnings in real-time</p>
            </div>

            <div className="stats-grid">
                <div className="stat-card glass bord-primary">
                    <User size={24} color="var(--primary)" />
                    <div className="stat-val">{stats.users.total}</div>
                    <small>Total Users</small>
                </div>
                <div className="stat-card glass bord-primary">
                    <Car size={24} color="var(--primary)" />
                    <div className="stat-val">{stats.rides.total}</div>
                    <small>Total Rides</small>
                </div>
                <div className="stat-card glass bord-primary">
                    <Zap size={24} color="var(--primary)" />
                    <div className="stat-val">Rs. {stats.finance.revenue}</div>
                    <small>Total Revenue</small>
                </div>
                <div className="stat-card glass">
                    <div className="stat-val">{stats.rides.active}</div>
                    <small>Live Rides</small>
                </div>
            </div>

            <div className="premium-card glass" style={{ marginTop: '40px', padding: '32px' }}>
                <h3>Recent Activity</h3>
                <div className="admin-table-wrapper">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Rider</th>
                                <th>Driver</th>
                                <th>Route</th>
                                <th>Fare</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentRides.map(r => (
                                <tr key={r.id}>
                                    <td>{r.rider.username}</td>
                                    <td>{r.driver?.username || '---'}</td>
                                    <td>{r.pickupAddress.substring(0, 20)}...</td>
                                    <td className="text-primary">Rs. {r.offeredFare}</td>
                                    <td><span className={`status-badge ${r.status.toLowerCase()}`}>{r.status}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <style jsx>{`
                .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; }
                .stat-card { padding: 32px; border-radius: 20px; text-align: center; }
                .stat-val { font-size: 2rem; font-weight: 800; margin: 12px 0 4px; }
                .stat-card small { color: var(--muted); text-transform: uppercase; font-size: 0.75rem; letter-spacing: 1px; }
                .bord-primary { border: 1px solid rgba(193, 255, 0, 0.2); }
                
                .admin-table-wrapper { margin-top: 24px; overflow-x: auto; }
                .admin-table { width: 100%; border-collapse: collapse; text-align: left; }
                .admin-table th { padding: 16px; color: var(--muted); font-size: 0.8rem; text-transform: uppercase; border-bottom: 1px solid var(--glass-border); }
                .admin-table td { padding: 16px; border-bottom: 1px solid var(--glass-border); font-size: 0.95rem; }
                .status-badge { padding: 4px 12px; border-radius: 100px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; }
                .status-badge.requested { background: rgba(193, 255, 0, 0.1); color: var(--primary); }
                .status-badge.accepted { background: rgba(0, 150, 255, 0.1); color: #0096ff; }
                .status-badge.completed { background: rgba(0, 255, 128, 0.1); color: #00ff80; }
            `}</style>
        </div>
    );
}

function WalletView({ balance, onUpdate, role }: { balance: number, onUpdate: (b: number) => void, role: string | null }) {
    const [amount, setAmount] = useState('');
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [wLoading, setWLoading] = useState(false);

    const handleDeposit = async () => {
        if (!amount || parseFloat(amount) <= 0) return;
        setLoading(true);
        try {
            const res = await api.post('/payments/deposit', { amount: parseFloat(amount) });
            onUpdate(res.data.balance);
            setAmount('');
            toast.success('Funds added successfully!');
        } catch (err) {
            toast.error('Failed to add funds');
        } finally {
            setLoading(false);
        }
    };

    const handleWithdraw = async () => {
        if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) return;
        if (parseFloat(withdrawAmount) > balance) {
            toast.error('Insufficient balance');
            return;
        }
        setWLoading(true);
        try {
            const res = await api.post('/payments/withdraw', { amount: parseFloat(withdrawAmount) });
            onUpdate(res.data.balance);
            setWithdrawAmount('');
            toast.success('Withdrawal successful!');
        } catch (err) {
            toast.error('Failed to withdraw funds');
        } finally {
            setWLoading(false);
        }
    };

    return (
        <div className="wallet-view">
            <div className="welcome-section">
                <h1>My Wallet</h1>
                <p>Manage your funds and transaction history</p>
            </div>

            <div className="wallet-grid">
                <div className="premium-card glass balance-card" style={role === 'Driver' ? { gridColumn: 'span 2' } : {}}>
                    <Wallet size={48} color="var(--primary)" />
                    <div className="balance-info">
                        <small>Current Balance</small>
                        <h2>Rs. {balance.toLocaleString()}</h2>
                    </div>
                </div>

                {role === 'Rider' && (
                    <div className="premium-card glass deposit-card">
                        <h3>Add Funds</h3>
                        <p>Enter the amount you want to deposit</p>
                        <div className="deposit-input-row" style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                            <div className="input-group" style={{ flex: 1 }}>
                                <span className="input-icon">Rs.</span>
                                <input
                                    type="number"
                                    placeholder="0.00"
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                    style={{ width: '100%', paddingLeft: '40px' }}
                                />
                            </div>
                            <button
                                onClick={handleDeposit}
                                disabled={loading || !amount}
                                className="premium-button"
                            >
                                {loading ? 'Processing...' : 'Deposit'}
                            </button>
                        </div>
                    </div>
                )}

                {role === 'Driver' && (
                    <div className="premium-card glass withdraw-card" style={{ gridColumn: 'span 2' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h3>Withdraw Earnings</h3>
                                <p>Transfer your driver earnings to your bank account / local provider</p>
                            </div>
                            <div className="withdraw-input-row" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                <div className="input-group" style={{ width: '200px' }}>
                                    <span className="input-icon">Rs.</span>
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        value={withdrawAmount}
                                        onChange={e => setWithdrawAmount(e.target.value)}
                                        style={{ width: '100%', paddingLeft: '40px' }}
                                    />
                                </div>
                                <button
                                    onClick={handleWithdraw}
                                    disabled={wLoading || !withdrawAmount}
                                    className="premium-button"
                                    style={{ background: 'transparent', border: '1px solid var(--primary)', color: 'var(--primary)' }}
                                >
                                    {wLoading ? 'Processing...' : 'Withdraw'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{`
                .wallet-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
                .balance-card { padding: 40px; display: flex; align-items: center; gap: 30px; }
                .balance-info small { color: var(--muted); text-transform: uppercase; letter-spacing: 1px; }
                .balance-info h2 { font-size: 3rem; margin: 4px 0 0; color: var(--primary); }
                .deposit-card { padding: 40px; }
                .deposit-card h3 { margin: 0 0 8px; }
                .deposit-card p { color: var(--muted); margin: 0; }
                .input-group { position: relative; }
                .input-icon { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: var(--muted); font-weight: 700; }
                
                @media (max-width: 900px) {
                    .wallet-grid { grid-template-columns: 1fr; }
                }
            `}</style>
        </div>
    );
}
