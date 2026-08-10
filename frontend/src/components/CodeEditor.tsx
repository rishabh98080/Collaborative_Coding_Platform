'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

interface CodeEditorProps {
    documentId: string;
    initialContent?: string;
    currentUser: string;
    onConnectionChange?: (isConnected: boolean) => void;
    onUserActivity?: (user: string) => void;
}

export default function CodeEditor({
    documentId,
    initialContent = '',
    currentUser,
    onConnectionChange,
    onUserActivity
}: CodeEditorProps) {
    const [code, setCode] = useState(initialContent);
    const stompClientRef = useRef<Client | null>(null);
    const isRemoteUpdate = useRef(false);

    useEffect(() => {
        const client = new Client({
            webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
            debug: (str: string) => {
                // console.log(str); // Commented to reduce noise
            },
            reconnectDelay: 5000,
        });

        client.onConnect = () => {
            console.log('Connected to WebSocket!');
            if (onConnectionChange) onConnectionChange(true);

            // Listen to incoming changes
            client.subscribe(`/topic/document/${documentId}`, (message: any) => {
                if (message.body) {
                    const payload = JSON.parse(message.body);

                    if (payload.user && onUserActivity) {
                        onUserActivity(payload.user);
                    }

                    // Only process changes from other users
                    if (payload.user !== currentUser) {
                        isRemoteUpdate.current = true;
                        setCode(payload.content);
                    }
                }
            });
        };

        client.onDisconnect = () => {
            if (onConnectionChange) onConnectionChange(false);
        };
        client.onWebSocketError = () => {
            if (onConnectionChange) onConnectionChange(false);
        };

        client.activate();
        stompClientRef.current = client;

        return () => {
            if (stompClientRef.current) {
                stompClientRef.current.deactivate();
            }
        };
    }, [documentId, currentUser, onConnectionChange, onUserActivity]);



    const handleEditorChange = (value: string | undefined) => {
        if (isRemoteUpdate.current) {
            // Prevent infinite loop by ignoring the onChange triggered by remote updates
            isRemoteUpdate.current = false;
            return;
        }

        const newContent = value || '';
        setCode(newContent);

        // Broadcast real-time changes via STOMP WebSocket
        if (stompClientRef.current && stompClientRef.current.connected) {
            const payload = {
                user: currentUser,
                content: newContent,
                delta: null,
                position: null
            };

            stompClientRef.current.publish({
                destination: `/app/typing/${documentId}`,
                body: JSON.stringify(payload),
            });
        }

    };

    return (
        <div className="w-full h-full">
            <MonacoEditor
                height="100%"
                language="javascript"
                theme="vs-dark"
                value={code}
                onChange={handleEditorChange}
                options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    wordWrap: 'on',
                }}
            />
        </div>
    );
}
