'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Editor from '@monaco-editor/react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

export default function CodeEditor() {
    const params = useParams();
    const roomId = params?.roomId as string;

    const editorRef = useRef<any>(null);
    const stompClientRef = useRef<Client | null>(null);
    const isRemoteChange = useRef<boolean>(false);

    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!roomId) return;

        // Initialize STOMP / SockJS client connection
        const socket = new SockJS('http://localhost:8080/ws');
        const stompClient = new Client({
            webSocketFactory: () => socket,
            debug: (str) => console.log(str),
            onConnect: () => {
                console.log('Connected to WebSocket!');
                // Subscribe to room topic
                stompClient.subscribe(`/topic/document/${roomId}`, (message) => {
                    const payload = JSON.parse(message.body);
                    if (editorRef.current) {
                        const currentVal = editorRef.current.getValue();
                        if (payload.content !== currentVal) {
                            isRemoteChange.current = true;
                            editorRef.current.setValue(payload.content);
                            isRemoteChange.current = false;
                        }
                    }
                });
            },
        });

        stompClient.activate();
        stompClientRef.current = stompClient;

        return () => {
            stompClient.deactivate();
        };
    }, [roomId]);

    function handleEditorDidMount(editor: any) {
        editorRef.current = editor;
    }

    function handleEditorChange(value: string | undefined) {
        if (isRemoteChange.current || !value) return;

        // Broadcast local changes via STOMP fast lane
        if (stompClientRef.current && stompClientRef.current.connected) {
            stompClientRef.current.publish({
                destination: `/app/typing/${roomId}`,
                body: JSON.stringify({ content: value }),
            });
        }
    }

    const copyShareLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#1e1e1e' }}>
            <header style={{ padding: '12px 20px', background: '#2d2d2d', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '16px' }}>CodeSync Room: <span style={{ color: '#38bdf8' }}>{roomId}</span></h3>
                <button
                    onClick={copyShareLink}
                    style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                    {copied ? 'Link Copied!' : 'Share Room URL'}
                </button>
            </header>
            <div style={{ flex: 1 }}>
                <Editor
                    height="100%"
                    defaultLanguage="javascript"
                    theme="vs-dark"
                    defaultValue="// Start typing your code here..."
                    onMount={handleEditorDidMount}
                    onChange={handleEditorChange}
                />
            </div>
        </div>
    );
}
