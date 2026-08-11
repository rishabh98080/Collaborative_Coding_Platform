'use client';

import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const MonacoEditor = dynamic(
    () => import('@monaco-editor/react'),
    { ssr: false }
);

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
    onUserActivity,
}: CodeEditorProps) {

    const [code, setCode] = useState<string>(initialContent);

    const stompClientRef = useRef<Client | null>(null);
    const isRemoteUpdate = useRef<boolean>(false);

    /*
     * Keep callbacks in refs.
     *
     * This prevents the WebSocket connection from being
     * unnecessarily destroyed and recreated when the parent
     * component creates new callback functions on render.
     */
    const onConnectionChangeRef = useRef(onConnectionChange);
    const onUserActivityRef = useRef(onUserActivity);

    useEffect(() => {
        onConnectionChangeRef.current = onConnectionChange;
    }, [onConnectionChange]);

    useEffect(() => {
        onUserActivityRef.current = onUserActivity;
    }, [onUserActivity]);

    /*
     * Keep current user in a ref so the WebSocket connection
     * doesn't need to restart just because the callback/state
     * around the user changes.
     */
    const currentUserRef = useRef(currentUser);

    useEffect(() => {
        currentUserRef.current = currentUser;
    }, [currentUser]);

    /*
     * Update editor content if initialContent changes before
     * the user has started editing.
     */
    useEffect(() => {
        setCode(initialContent);
    }, [initialContent]);

    /*
     * Establish WebSocket connection.
     */
    useEffect(() => {

        /*
         * ----------------------------------------------------
         * API BASE URL
         * ----------------------------------------------------
         *
         * Production:
         *
         * NEXT_PUBLIC_API_BASE_URL=https://your-backend.onrender.com
         *
         * or:
         *
         * NEXT_PUBLIC_API_BASE=https://your-backend.onrender.com
         *
         * Development:
         *
         * http://localhost:8080
         */
        const API_BASE =
            process.env.NEXT_PUBLIC_API_BASE_URL ||
            process.env.NEXT_PUBLIC_API_BASE ||
            'http://localhost:8080';

        /*
         * Remove trailing slash.
         *
         * This prevents:
         *
         * https://backend.com//ws
         *
         * and produces:
         *
         * https://backend.com/ws
         */
        const API_URL = API_BASE.replace(/\/+$/, '');

        const WS_URL = `${API_URL}/ws`;

        console.log('======================================');
        console.log('🔌 Initializing WebSocket');
        console.log('📄 Document:', documentId);
        console.log('🌐 API Base:', API_URL);
        console.log('🔗 WebSocket:', WS_URL);
        console.log('👤 User:', currentUserRef.current);
        console.log('======================================');

        /*
         * Create STOMP client.
         */
        const client = new Client({

            /*
             * SockJS connection.
             */
            webSocketFactory: () => {

                console.log(
                    '🔄 Creating SockJS connection:',
                    WS_URL
                );

                return new SockJS(WS_URL);
            },

            /*
             * ------------------------------------------------
             * RENDER COLD START SUPPORT
             * ------------------------------------------------
             *
             * If Render is sleeping, the first connection
             * attempt may fail while the backend wakes up.
             *
             * STOMP will automatically retry every 3 seconds.
             */
            reconnectDelay: 3000,

            /*
             * Don't let a connection attempt hang forever.
             *
             * After 10 seconds STOMP will consider the attempt
             * failed and retry.
             */
            connectionTimeout: 10000,

            /*
             * Heartbeats help detect dead connections.
             */
            heartbeatIncoming: 10000,
            heartbeatOutgoing: 10000,

            /*
             * Keep STOMP debug logging disabled in production.
             *
             * Enable temporarily if debugging.
             */
            debug: (message: string) => {
                // console.log('[STOMP]', message);
            },
        });

        /*
         * ----------------------------------------------------
         * SUCCESSFUL CONNECTION
         * ----------------------------------------------------
         */
        client.onConnect = () => {

            console.log('✅ WebSocket connected');
            console.log('📄 Document:', documentId);

            onConnectionChangeRef.current?.(true);

            /*
             * Subscribe to this document.
             *
             * IMPORTANT:
             *
             * This is inside onConnect because STOMP subscriptions
             * need to be recreated after every reconnect.
             */
            client.subscribe(
                `/topic/document/${documentId}`,
                (message: IMessage) => {

                    /*
                     * Ignore empty messages.
                     */
                    if (!message.body) {
                        return;
                    }

                    try {

                        const payload = JSON.parse(message.body);

                        /*
                         * Notify parent about user activity.
                         */
                        if (payload.user) {

                            onUserActivityRef.current?.(
                                payload.user
                            );
                        }

                        /*
                         * Ignore messages sent by ourselves.
                         */
                        if (
                            payload.user !==
                            currentUserRef.current
                        ) {

                            /*
                             * Tell Monaco that the next onChange
                             * is caused by a remote update.
                             */
                            isRemoteUpdate.current = true;

                            setCode(
                                payload.content ?? ''
                            );
                        }

                    } catch (error) {

                        console.error(
                            '❌ Failed to process WebSocket message:',
                            error
                        );

                    }
                }
            );

            console.log(
                `📡 Subscribed to /topic/document/${documentId}`
            );
        };

        /*
         * ----------------------------------------------------
         * STOMP DISCONNECT
         * ----------------------------------------------------
         */
        client.onDisconnect = () => {

            console.log(
                '⚠️ STOMP disconnected'
            );

            onConnectionChangeRef.current?.(false);
        };

        /*
         * ----------------------------------------------------
         * WEBSOCKET CLOSE
         * ----------------------------------------------------
         */
        client.onWebSocketClose = (event) => {

            console.log(
                '⚠️ WebSocket connection closed',
                event
            );

            onConnectionChangeRef.current?.(false);

            /*
             * No manual reconnect is required here.
             *
             * STOMP's reconnectDelay automatically handles it.
             */
        };

        /*
         * ----------------------------------------------------
         * WEBSOCKET ERROR
         * ----------------------------------------------------
         */
        client.onWebSocketError = (error) => {

            console.error(
                '❌ WebSocket error:',
                error
            );

            onConnectionChangeRef.current?.(false);

            /*
             * STOMP will retry automatically.
             */
        };

        /*
         * ----------------------------------------------------
         * STOMP ERROR
         * ----------------------------------------------------
         */
        client.onStompError = (frame) => {

            console.error(
                '❌ STOMP broker error'
            );

            console.error(
                'Message:',
                frame.headers['message']
            );

            console.error(
                'Details:',
                frame.body
            );

            onConnectionChangeRef.current?.(false);
        };

        /*
         * ----------------------------------------------------
         * ACTIVATE CONNECTION
         * ----------------------------------------------------
         *
         * If Render is asleep:
         *
         * Attempt 1
         *      ↓
         * Render wakes
         *      ↓
         * attempt fails/times out
         *      ↓
         * wait 3 seconds
         *      ↓
         * Attempt 2
         *      ↓
         * CONNECTED
         *
         * No page refresh required.
         */
        console.log(
            '🚀 Activating STOMP client...'
        );

        client.activate();

        /*
         * Store client for editor publishing.
         */
        stompClientRef.current = client;

        /*
         * ----------------------------------------------------
         * CLEANUP
         * ----------------------------------------------------
         */
        return () => {

            console.log(
                '🔌 Cleaning up WebSocket connection'
            );

            /*
             * Prevent this client from reconnecting.
             */
            client.deactivate();

            /*
             * Only clear the ref if it still points
             * to this client.
             */
            if (
                stompClientRef.current === client
            ) {

                stompClientRef.current = null;
            }
        };

    }, [documentId]);


    /*
     * --------------------------------------------------------
     * MONACO EDITOR CHANGE
     * --------------------------------------------------------
     */
    const handleEditorChange = (
        value: string | undefined
    ) => {

        /*
         * Monaco fires onChange when setCode() changes
         * the editor because of a remote update.
         *
         * Don't broadcast that update again.
         */
        if (isRemoteUpdate.current) {

            isRemoteUpdate.current = false;

            return;
        }

        /*
         * Monaco can return undefined.
         */
        const newContent = value ?? '';

        /*
         * Update local editor immediately.
         */
        setCode(newContent);

        /*
         * Get active STOMP client.
         */
        const client = stompClientRef.current;

        /*
         * Only publish if the WebSocket is actually connected.
         */
        if (
            client &&
            client.connected
        ) {

            const payload = {
                user: currentUserRef.current,
                content: newContent,
                delta: null,
                position: null,
            };

            try {

                client.publish({
                    destination: `/app/typing/${documentId}`,
                    body: JSON.stringify(payload),
                });

            } catch (error) {

                console.error(
                    '❌ Failed to publish editor change:',
                    error
                );

            }

        } else {

            /*
             * This can happen while Render is waking up.
             *
             * We intentionally don't throw an error because
             * the editor should remain usable locally.
             */
            console.warn(
                '⚠️ WebSocket not connected. Change was kept locally.'
            );
        }
    };


    /*
     * --------------------------------------------------------
     * RENDER
     * --------------------------------------------------------
     */
    return (
        <div className="w-full h-full">

            <MonacoEditor
                height="100%"
                language="javascript"
                theme="vs-dark"
                value={code}
                onChange={handleEditorChange}
                options={{
                    minimap: {
                        enabled: false,
                    },

                    fontSize: 14,

                    wordWrap: 'on',
                }}
            />

        </div>
    );
}
