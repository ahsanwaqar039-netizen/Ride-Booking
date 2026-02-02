'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, X, User, MessageCircle } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface Message {
    id: number;
    rideId: number;
    senderId: number;
    senderName: string;
    content: string;
    sentAt: string;
}

interface ChatWindowProps {
    rideId: number;
    currentUserId: number;
    onClose: () => void;
    token: string;
}

export default function ChatWindow({ rideId, currentUserId, onClose, token }: ChatWindowProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [connection, setConnection] = useState<any>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await api.get(`/chat/history/${rideId}`);
                setMessages(res.data);
            } catch (err) {
                console.error('Failed to fetch chat history', err);
            }
        };
        fetchHistory();

        let currentConnection: any = null;
        let isMounted = true;

        const setupSignalR = async () => {
            try {
                const signalR = await import('@microsoft/signalr');
                const baseUrl = 'http://localhost:5000';

                currentConnection = new signalR.HubConnectionBuilder()
                    .withUrl(`${baseUrl}/chatHub`, {
                        accessTokenFactory: () => token,
                        skipNegotiation: false,
                        transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling
                    })
                    .withAutomaticReconnect()
                    .build();

                currentConnection.on('ReceiveMessage', (msg: Message) => {
                    if (isMounted) {
                        setMessages(prev => {
                            // Prevent duplicate messages if any
                            if (prev.find(m => m.id === msg.id)) return prev;
                            return [...prev, msg];
                        });
                    }
                });

                await currentConnection.start();
                console.log('SignalR Chat Connected');

                if (isMounted) {
                    await currentConnection.invoke('JoinRideChat', rideId);
                    setConnection(currentConnection);
                }
            } catch (err) {
                console.error('SignalR Chat Connection Error:', err);
                toast.error('Could not connect to live chat');
            }
        };
        setupSignalR();

        return () => {
            isMounted = false;
            if (currentConnection) {
                currentConnection.stop().catch(() => { });
                setConnection(null);
            }
        };
    }, [rideId, token]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !connection) return;

        try {
            await connection.invoke('SendMessage', rideId, input);
            setInput('');
        } catch (err) {
            toast.error('Failed to send message');
        }
    };

    return (
        <div className="chat-window-container glass">
            <div className="chat-header">
                <div className="chat-title">
                    <MessageCircle size={20} color="var(--primary)" />
                    <span>Ride Chat</span>
                </div>
                <button onClick={onClose} className="close-btn"><X size={18} /></button>
            </div>

            <div className="messages-area" ref={scrollRef}>
                {messages.length === 0 ? (
                    <div className="empty-chat">
                        <MessageCircle size={48} color="var(--muted)" opacity={0.2} />
                        <p>No messages yet. Say hello!</p>
                    </div>
                ) : (
                    messages.map((m, i) => (
                        <div key={i} className={`message-wrapper ${m.senderId === currentUserId ? 'own' : 'other'}`}>
                            <div className="message-bubble">
                                <span className="sender-name">{m.senderId === currentUserId ? 'You' : m.senderName}</span>
                                <p className="message-content">{m.content}</p>
                                <span className="message-time">
                                    {typeof window !== 'undefined' ? new Date(m.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <form className="chat-input-area" onSubmit={handleSendMessage}>
                <input
                    type="text"
                    placeholder="Type a message..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="glass-input"
                />
                <button type="submit" className="send-btn grad-primary" disabled={!input.trim()}>
                    <Send size={18} color="#000" />
                </button>
            </form>

            <style jsx>{`
                .chat-window-container {
                    width: 350px;
                    height: 500px;
                    display: flex;
                    flex-direction: column;
                    border: 1px solid var(--glass-border);
                    border-radius: 20px;
                    overflow: hidden;
                    box-shadow: 0 20px 50px rgba(0,0,0,0.5);
                    position: fixed;
                    bottom: 24px;
                    right: 24px;
                    z-index: 1000;
                    background: rgba(10, 10, 10, 0.95);
                    backdrop-filter: blur(20px);
                }
                .chat-header {
                    padding: 16px 20px;
                    background: rgba(255, 255, 255, 0.05);
                    border-bottom: 1px solid var(--glass-border);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .chat-title {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-weight: 700;
                }
                .close-btn {
                   background: transparent;
                   color: var(--muted);
                   border: none;
                   cursor: pointer;
                }
                .messages-area {
                    flex: 1;
                    padding: 20px;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                .empty-chat {
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    color: var(--muted);
                    font-size: 0.9rem;
                }
                .message-wrapper {
                    display: flex;
                    width: 100%;
                }
                .message-wrapper.own { justify-content: flex-end; }
                .message-bubble {
                    max-width: 80%;
                    padding: 10px 14px;
                    border-radius: 14px;
                    font-size: 0.9rem;
                    position: relative;
                }
                .own .message-bubble {
                    background: var(--primary);
                    color: black;
                    border-bottom-right-radius: 2px;
                }
                .other .message-bubble {
                    background: rgba(255,255,255,0.1);
                    color: white;
                    border-bottom-left-radius: 2px;
                }
                .sender-name {
                    display: block;
                    font-size: 0.7rem;
                    font-weight: 700;
                    margin-bottom: 4px;
                    opacity: 0.7;
                }
                .message-time {
                    display: block;
                    font-size: 0.65rem;
                    margin-top: 4px;
                    opacity: 0.6;
                    text-align: right;
                }
                .chat-input-area {
                    padding: 16px;
                    background: rgba(255, 255, 255, 0.03);
                    border-top: 1px solid var(--glass-border);
                    display: flex;
                    gap: 10px;
                }
                .glass-input {
                    flex: 1;
                    background: rgba(255,255,255,0.05);
                    border: 1px solid var(--glass-border);
                    padding: 10px 16px;
                    border-radius: 12px;
                    color: white;
                }
                .send-btn {
                    width: 44px;
                    height: 44px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: none;
                }
                .send-btn:disabled { opacity: 0.5; cursor: not-allowed; }
            `}</style>
        </div>
    );
}
