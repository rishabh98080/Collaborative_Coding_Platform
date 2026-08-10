'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Editor from '@monaco-editor/react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import AuthModal from '@/components/AuthModal';

export default function CodeEditor() {
    const params = useParams();
    const roomId = params?.roomId as string;

    const editorRef = useRef<any>(null);
    const stompClientRef = useRef<Client | null>(null);
    const isRemoteChange = useRef<boolean>(false);

    // API base: prefer NEXT_PUBLIC_API_BASE at build time, fallback to current origin in browser
    const API_BASE: string = (typeof window !== 'undefined')
        ? (process.env.NEXT_PUBLIC_API_BASE || `${window.location.protocol}//${window.location.hostname}${window.location.port ? `:${window.location.port}` : ''}`)
        : (process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080');
    
    const api = (path: string) => `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;

    const [copied, setCopied] = useState(false);
    const [language, setLanguage] = useState('javascript');
    const [theme, setTheme] = useState('light');
    const [stdin, setStdin] = useState('');
    const [output, setOutput] = useState('');
    const [terminalMode, setTerminalMode] = useState<'input' | 'output'>('input');
    const [isRunning, setIsRunning] = useState(false);
    const [activeUsers, setActiveUsers] = useState<any[]>([]);
    const [chatMessages, setChatMessages] = useState<any[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [remoteCursors, setRemoteCursors] = useState<Record<string, { name: string, emoji: string, lineNumber: number, column: number }>>({});

    const isSyncEnabledRef = useRef(true);
    const [isSyncEnabled, setIsSyncEnabledState] = useState(true);

    const toggleSync = () => {
        const newState = !isSyncEnabled;
        setIsSyncEnabledState(newState);
        isSyncEnabledRef.current = newState;
    };

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const oldDecorationsRef = useRef<string[]>([]);
    const monacoRef = useRef<any>(null);

    const [localUser, setLocalUser] = useState(() => {
        const names = ["Alpha", "Beta", "Gamma", "Delta", "Echo", "Falcon", "Ghost", "Hawk", "Maverick", "Nova"];
        const emojis = ["🐼", "🦊", "🚀", "🦄", "🐉", "🐧", "🐙", "🦁", "🐯", "🤖"];
        return {
            name: names[Math.floor(Math.random() * names.length)] + '_' + Math.floor(Math.random() * 100),
            emoji: emojis[Math.floor(Math.random() * emojis.length)]
        };
    });

    const [authContext, setAuthContext] = useState<'save' | 'load' | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Initial check for auth state in local storage (UI only)
    useEffect(() => {
        const user = localStorage.getItem('username');
        if (user) {
            setIsAuthenticated(true);
            setLocalUser(prev => ({ ...prev, name: user }));
        }
    }, []);

    // Prompt user to save when leaving the page if unauthenticated
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (!isAuthenticated) {
                e.preventDefault();
                e.returnValue = '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [isAuthenticated]);

    const initialContentFetched = useRef<string | null>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    useEffect(() => {
        if (!editorRef.current || !monacoRef.current) return;

        try {
            const decorations = Object.values(remoteCursors).map(cursor => ({
                range: new monacoRef.current.Range(cursor.lineNumber, cursor.column, cursor.lineNumber, cursor.column),
                options: {
                    className: 'remote-cursor-line',
                    after: {
                        content: ` ${cursor.emoji} ${cursor.name} `,
                        inlineClassName: 'remote-cursor-widget',
                    }
                }
            }));

            oldDecorationsRef.current = editorRef.current.deltaDecorations(oldDecorationsRef.current, decorations);
        } catch (e) {
            console.error("Failed to render cursor", e);
        }
    }, [remoteCursors]);

    useEffect(() => {
        if (!roomId) return;

        // Fetch initial memory state for late joiners/refreshes
        fetch(api(`/api/room/${roomId}`))
            .then(res => res.json())
            .then(data => {
                if (data.language) {
                    setLanguage(data.language);
                }
                if (data.content) {
                    if (editorRef.current) {
                        editorRef.current.setValue(data.content);
                    } else {
                        initialContentFetched.current = data.content;
                    }
                }
            })
            .catch(err => console.error('Failed to fetch initial room state', err));

        // Initialize STOMP / SockJS client connection
        const socket = new SockJS(api('/ws'));
        const stompClient = new Client({
            webSocketFactory: () => socket,
            debug: (str) => console.log(str),
            onConnect: () => {
                console.log('Connected to WebSocket!');
                // Subscribe to room topic
                stompClient.subscribe(`/topic/document/${roomId}`, (message) => {
                    const payload = JSON.parse(message.body);

                    if (payload.type === 'language') {
                        if (payload.language && payload.language !== language) {
                            if (!isSyncEnabledRef.current) return;
                            setLanguage(payload.language);
                        }
                    } else if (payload.type === 'code' || !payload.type) {
                        if (!isSyncEnabledRef.current) return;

                        if (editorRef.current) {
                            const currentVal = editorRef.current.getValue();
                            if (payload.content !== currentVal) {
                                isRemoteChange.current = true;

                                // Preserve cursor position
                                const position = editorRef.current.getPosition();

                                editorRef.current.setValue(payload.content);

                                // Restore cursor position
                                if (position) {
                                    editorRef.current.setPosition(position);
                                }

                                isRemoteChange.current = false;
                            }
                        }
                    }
                });

                // Subscribe to presence topic
                stompClient.subscribe(`/topic/presence/${roomId}`, (message) => {
                    const users = JSON.parse(message.body);
                    setActiveUsers(users);
                }, { name: localUser.name, emoji: localUser.emoji });

                // Subscribe to chat
                stompClient.subscribe(`/topic/chat/${roomId}`, (message) => {
                    const chatMsg = JSON.parse(message.body);
                    setChatMessages(prev => [...prev, chatMsg]);
                });

                // Subscribe to cursors
                stompClient.subscribe(`/topic/cursor/${roomId}`, (message) => {
                    const cursorMsg = JSON.parse(message.body);
                    console.log("Received remote cursor from:", cursorMsg.name, "Local is:", localUser.name);
                    if (cursorMsg.name !== localUser.name) {
                        setRemoteCursors(prev => ({
                            ...prev,
                            [cursorMsg.name]: cursorMsg
                        }));
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

    function handleEditorDidMount(editor: any, monaco: any) {
        editorRef.current = editor;
        monacoRef.current = monaco;

        // Inject pre-fetched content if it arrived before the editor finished loading
        if (initialContentFetched.current) {
            editor.setValue(initialContentFetched.current);
            initialContentFetched.current = null;
        }

        editor.onDidChangeCursorPosition((e: any) => {
            if (stompClientRef.current && stompClientRef.current.connected) {
                stompClientRef.current.publish({
                    destination: `/app/cursor/${roomId}`,
                    body: JSON.stringify({
                        name: localUser.name,
                        emoji: localUser.emoji,
                        lineNumber: e.position.lineNumber,
                        column: e.position.column
                    })
                });
            }
        });
    }

    function handleEditorChange(value: string | undefined) {
        if (isRemoteChange.current || !value || !isSyncEnabledRef.current) return;

        // Broadcast local changes via STOMP fast lane
        if (stompClientRef.current && stompClientRef.current.connected) {
            stompClientRef.current.publish({
                destination: `/app/typing/${roomId}`,
                body: JSON.stringify({ type: 'code', content: value }),
            });
        }
    }

    const copyShareLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newLang = e.target.value;
        setLanguage(newLang);

        // Sync language change
        if (stompClientRef.current && stompClientRef.current.connected) {
            stompClientRef.current.publish({
                destination: `/app/typing/${roomId}`,
                body: JSON.stringify({ type: 'language', language: newLang }),
            });
        }
    };

    const sendChatMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatInput.trim() || !stompClientRef.current?.connected) return;

        const msg = {
            sender: localUser.name,
            emoji: localUser.emoji,
            text: chatInput,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        stompClientRef.current.publish({
            destination: `/app/chat/${roomId}`,
            body: JSON.stringify(msg)
        });

        setChatInput('');
    };

    const runCode = async () => {
        if (!editorRef.current || language === 'plaintext') return;

        setIsRunning(true);
        setTerminalMode('output');
        setOutput('Running...');

        const sourceCode = editorRef.current.getValue();

        try {
            const res = await fetch(api('/api/execute'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    language: language,
                    code: sourceCode,
                    input: stdin
                })
            });

            const data = await res.json();
            if (data.run) {
                setOutput(data.run.output || 'No output');
            } else if (data.message) {
                setOutput(`Error: ${data.message}`);
            }
        } catch (error) {
            setOutput('Failed to execute code. Check your network or try again later.');
        } finally {
            setIsRunning(false);
        }
    };

    const handleLogout = async () => {
        try {
            await fetch(api('/api/auth/logout'), { method: 'POST', credentials: 'include' });
        } catch (e) {
            console.error("Logout failed", e);
        }
        localStorage.removeItem('username');
        setIsAuthenticated(false);
    };

    const handleAuthSuccess = async (username: string) => {
        localStorage.setItem('username', username);
        setIsAuthenticated(true);
        setLocalUser(prev => ({ ...prev, name: username }));

        const currentContext = authContext;
        setAuthContext(null);

        if (currentContext === 'load') {
            // Try to fetch last session
            try {
                const res = await fetch(api('/api/sessions/last'), {
                    credentials: 'include'
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.codeContent && editorRef.current) {
                        editorRef.current.setValue(data.codeContent);
                    }
                    if (data.chatTranscript) {
                        setChatMessages(JSON.parse(data.chatTranscript));
                    }
                }
            } catch (e) {
                console.error("Could not fetch past session", e);
            }
        } else if (currentContext === 'save') {
            // Save the session right after login/register
            await saveSession();
        }
    };

    const saveSession = async () => {
        const currentCode = editorRef.current?.getValue() || '';
        const transcript = JSON.stringify(chatMessages);
        try {
            await fetch(api('/api/sessions/last'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ codeContent: currentCode, chatTranscript: transcript })
            });
            alert("Session saved to your account!");
            await handleLogout();
            window.location.href = '/'; // Navigate away after saving
        } catch (e) {
            console.error("Failed to save session", e);
        }
    };

    const handlePastConvo = async () => {
        if (!isAuthenticated) {
            setAuthContext('load');
            return;
        }

        // Try to fetch last session immediately if already authenticated
        try {
            const res = await fetch(api('/api/sessions/last'), {
                credentials: 'include'
            });
            if (res.ok) {
                const data = await res.json();
                if (data.codeContent && editorRef.current) {
                    editorRef.current.setValue(data.codeContent);
                }
                if (data.chatTranscript) {
                    setChatMessages(JSON.parse(data.chatTranscript));
                }
            }
        } catch (e) {
            console.error("Could not fetch past session", e);
        }
    };

    const handleExit = () => {
        if (!isAuthenticated) {
            setAuthContext('save');
        } else {
            saveSession();
        }
    };

    const getLanguageInfo = (lang: string) => {
        switch (lang.toLowerCase()) {
            case 'javascript': return { icon: 'JS', ext: 'main.js' };
            case 'typescript': return { icon: 'TS', ext: 'main.ts' };
            case 'python': return { icon: 'PY', ext: 'main.py' };
            case 'java': return { icon: 'JA', ext: 'Main.java' };
            case 'cpp': return { icon: 'C++', ext: 'main.cpp' };
            case 'c': return { icon: 'C', ext: 'main.c' };
            case 'csharp': return { icon: 'C#', ext: 'Program.cs' };
            case 'fsharp': return { icon: 'F#', ext: 'Program.fs' };
            case 'go': return { icon: 'GO', ext: 'main.go' };
            case 'rust': return { icon: 'RS', ext: 'main.rs' };
            case 'php': return { icon: 'PHP', ext: 'main.php' };
            case 'ruby': return { icon: 'RB', ext: 'main.rb' };
            case 'haskell': return { icon: 'HS', ext: 'Main.hs' };
            case 'plaintext': return { icon: 'TXT', ext: 'document.txt' };
            default: return { icon: lang.substring(0, 2).toUpperCase(), ext: `main.${lang}` };
        }
    };
    const langInfo = getLanguageInfo(language);

    return (
        <div className={theme !== 'light' ? 'dark-theme' : ''} style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--background)' }}>
            {/* Top Navigation */}
            <header style={{
                height: '72px',
                padding: '0 24px',
                background: 'var(--surface)',
                borderBottom: '1px solid var(--border)',
                color: 'var(--text-primary)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                zIndex: 10
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', letterSpacing: '-0.5px' }}>
                        CodeSync <span style={{ color: 'var(--border)', margin: '0 8px' }}>|</span>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '14px', fontFamily: 'var(--font-mono)' }}>
                            {roomId?.substring(0, 8).toUpperCase()}
                        </span>
                        <button onClick={copyShareLink} style={{ marginLeft: '8px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} title="Copy URL">
                            ⧉
                        </button>
                    </h3>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '8px', paddingLeft: '16px', borderLeft: '1px solid var(--border)' }}>
                        {activeUsers.map(user => (
                            <div
                                key={user.id}
                                className="user-avatar"
                                style={{
                                    position: 'relative',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    width: '28px', height: '28px', borderRadius: '50%',
                                    background: 'var(--surface-secondary)', border: '1px solid var(--border)',
                                    fontSize: '14px', cursor: 'help'
                                }}
                            >
                                {user.emoji}
                                <span className="user-tooltip">{user.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <select
                        value={language}
                        onChange={handleLanguageChange}
                        style={{ padding: '6px 12px', borderRadius: '8px', background: 'var(--surface-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)', outline: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}
                    >
                        <option value="javascript">JavaScript</option>
                        <option value="typescript">TypeScript</option>
                        <option value="python">Python</option>
                        <option value="java">Java</option>
                        <option value="cpp">C++</option>
                        <option value="c">C</option>
                        <option value="csharp">C#</option>
                        <option value="fsharp">F#</option>
                        <option value="go">Go</option>
                        <option value="rust">Rust</option>
                        <option value="php">PHP</option>
                        <option value="ruby">Ruby</option>
                        <option value="haskell">Haskell</option>
                        <option value="plaintext">Plain Text</option>
                    </select>

                    <select
                        value={theme}
                        onChange={(e) => setTheme(e.target.value)}
                        style={{ padding: '6px 12px', borderRadius: '8px', background: 'var(--surface-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)', outline: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}
                    >
                        <option value="light">Light Theme</option>
                        <option value="vs-dark">Dark Theme</option>
                        <option value="hc-black">High Contrast</option>
                    </select>
                </div>

                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <button
                        onClick={toggleSync}
                        style={{
                            background: 'transparent',
                            color: isSyncEnabled ? 'var(--success)' : 'var(--text-muted)',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: isSyncEnabled ? 'var(--success)' : 'var(--border)' }}></span>
                        Sync: {isSyncEnabled ? 'ON' : 'OFF'}
                    </button>

                    <button
                        onClick={runCode}
                        disabled={isRunning || language === 'plaintext'}
                        style={{
                            background: (isRunning || language === 'plaintext') ? 'var(--surface-secondary)' : 'var(--accent)',
                            color: (isRunning || language === 'plaintext') ? 'var(--text-muted)' : '#fff',
                            border: 'none',
                            padding: '8px 20px',
                            borderRadius: '10px',
                            cursor: (isRunning || language === 'plaintext') ? 'not-allowed' : 'pointer',
                            fontSize: '14px',
                            fontWeight: '600',
                            transition: 'background 0.14s ease'
                        }}>
                        {isRunning ? 'Running...' : 'Run Code'}
                    </button>

                    <button
                        onClick={copyShareLink}
                        style={{
                            background: 'var(--surface)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border)',
                            padding: '8px 16px',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500',
                            transition: 'all 0.14s ease'
                        }}>
                        {copied ? 'Copied' : '↗ Share URL'}
                    </button>

                    <button
                        onClick={handlePastConvo}
                        style={{
                            background: 'var(--surface-secondary)',
                            color: 'var(--accent)',
                            border: '1px solid var(--accent)',
                            padding: '8px 16px',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '600',
                            transition: 'all 0.14s ease'
                        }}>
                        Past Convo
                    </button>

                    <button
                        onClick={handleExit}
                        style={{
                            background: 'transparent',
                            color: 'var(--error, #e53935)',
                            border: '1px solid var(--error, #e53935)',
                            padding: '8px 16px',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '600',
                            transition: 'all 0.14s ease'
                        }}>
                        Exit & Save
                    </button>
                </div>
            </header>

            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                {/* Left Navigation Rail */}
                <aside style={{
                    width: '72px',
                    background: 'var(--surface)',
                    borderRight: '1px solid var(--border)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '24px 0',
                    gap: '16px'
                }}>
                    <button style={{ width: '44px', height: '44px', borderRadius: '9px', background: 'var(--accent-soft)', color: 'var(--accent)', border: 'none', fontSize: '20px', cursor: 'pointer' }} title="Code">
                        ⌨️
                    </button>
                    <button style={{ width: '44px', height: '44px', borderRadius: '9px', background: 'transparent', color: 'var(--text-secondary)', border: 'none', fontSize: '20px', cursor: 'pointer', visibility: 'hidden' }} title="Files">
                        📁
                    </button>
                    <button style={{ width: '44px', height: '44px', borderRadius: '9px', background: 'transparent', color: 'var(--text-secondary)', border: 'none', fontSize: '20px', cursor: 'pointer', visibility: 'hidden' }} title="Settings">
                        ⚙️
                    </button>
                </aside>

                {/* Main Workspace (Editor + STDIN/STDOUT) */}
                <div style={{ flex: '1 1 70%', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--background)' }}>
                    <div style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column' }}>
                        {/* Editor Header */}
                        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px' }}>
                            <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>{langInfo.icon}</span> {langInfo.ext}
                            </div>
                        </div>

                        <div style={{
                            flex: 1,
                            borderRadius: '16px',
                            overflow: 'hidden',
                            border: '1px solid var(--border)',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.025), 0 8px 24px rgba(0,0,0,0.025)',
                            background: 'var(--surface)'
                        }}>
                            <Editor
                                height="100%"
                                language={language}
                                theme={theme}
                                defaultValue="// Start typing your code here..."
                                onMount={handleEditorDidMount}
                                onChange={handleEditorChange}
                                options={{
                                    minimap: { enabled: false },
                                    padding: { top: 24, bottom: 24 },
                                    fontSize: 14,
                                    fontFamily: '"SFMono-Regular", "JetBrains Mono", monospace',
                                    lineNumbersMinChars: 3,
                                    scrollBeyondLastLine: false,
                                    renderLineHighlight: 'none',
                                    hideCursorInOverviewRuler: true
                                }}
                            />
                        </div>
                    </div>

                    <div style={{ height: '30%', display: 'flex', flexDirection: 'row', padding: '0 24px 24px 24px', gap: '24px' }}>
                        {/* Tabbed Terminal Panel */}
                        <div style={{
                            flex: 1,
                            background: 'var(--surface)',
                            border: '1px solid var(--border)',
                            borderRadius: '16px',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.025)'
                        }}>
                            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: '16px' }}>
                                <button
                                    onClick={() => setTerminalMode('input')}
                                    style={{ background: 'transparent', border: 'none', color: terminalMode === 'input' ? 'var(--accent)' : 'var(--text-muted)', fontSize: '12px', fontWeight: '700', letterSpacing: '0.5px', cursor: 'pointer', padding: 0 }}
                                >
                                    STDIN (INPUT)
                                </button>
                                <button
                                    onClick={() => setTerminalMode('output')}
                                    style={{ background: 'transparent', border: 'none', color: terminalMode === 'output' ? 'var(--accent)' : 'var(--text-muted)', fontSize: '12px', fontWeight: '700', letterSpacing: '0.5px', cursor: 'pointer', padding: 0 }}
                                >
                                    OUTPUT
                                </button>
                            </div>

                            {terminalMode === 'input' ? (
                                <textarea
                                    value={stdin}
                                    onChange={(e) => setStdin(e.target.value)}
                                    placeholder="Enter your upfront standard input here..."
                                    style={{ flex: 1, padding: '16px', background: 'transparent', color: 'var(--text-primary)', border: 'none', resize: 'none', outline: 'none', fontFamily: 'var(--font-mono)', fontSize: '13px', lineHeight: '1.5' }}
                                />
                            ) : (
                                <div style={{ flex: 1, padding: '16px', overflowY: 'auto', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', fontSize: '13px', lineHeight: '1.5' }}>
                                    {output || 'No output yet'}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Chat Sidebar */}
                <div style={{
                    width: '320px',
                    display: 'flex',
                    flexDirection: 'column',
                    background: 'var(--surface)',
                    borderLeft: '1px solid var(--border)'
                }}>
                    <div style={{ padding: '24px 24px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>PEER CHAT</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)' }}></span>
                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{activeUsers.length} Online</span>
                        </div>
                    </div>

                    <div style={{ padding: '0 24px 16px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {activeUsers.map(user => (
                            <div
                                key={user.id}
                                className="user-avatar"
                                style={{
                                    position: 'relative',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    width: '28px', height: '28px', borderRadius: '50%',
                                    background: 'var(--surface-secondary)', border: '1px solid var(--border-subtle)',
                                    fontSize: '14px', cursor: 'help'
                                }}
                            >
                                {user.emoji}
                                <span className="user-tooltip">{user.name}</span>
                            </div>
                        ))}
                    </div>

                    <div style={{ flex: 1, padding: '0 24px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {chatMessages.length === 0 ? (
                            <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '40px', fontSize: '13px' }}>
                                No messages yet<br /><br />Say hello and start coding together.
                            </div>
                        ) : (
                            chatMessages.map((msg, i) => (
                                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                                        <span style={{ fontSize: '14px' }}>{msg.emoji}</span>
                                        <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)' }}>{msg.sender}</span>
                                        <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>{msg.timestamp}</span>
                                    </div>
                                    <div style={{ color: 'var(--text-primary)', fontSize: '13px', background: 'var(--surface-secondary)', padding: '10px 12px', borderRadius: '0 12px 12px 12px', wordBreak: 'break-word', lineHeight: '1.4' }}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <form onSubmit={sendChatMessage} style={{ padding: '16px 24px', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: '8px' }}>
                        <input
                            type="text"
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            placeholder="Type a message..."
                            style={{ flex: 1, padding: '10px 12px', background: 'var(--surface-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)', borderRadius: '10px', outline: 'none', fontSize: '13px' }}
                        />
                        <button type="submit" disabled={!chatInput.trim()} style={{ background: chatInput.trim() ? 'var(--accent)' : 'var(--surface-secondary)', color: chatInput.trim() ? '#fff' : 'var(--text-muted)', border: 'none', borderRadius: '10px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: chatInput.trim() ? 'pointer' : 'not-allowed', transition: 'all 0.14s ease' }}>
                            ↑
                        </button>
                    </form>
                </div>
            </div>
            {authContext && (
                <AuthModal
                    onClose={() => setAuthContext(null)}
                    onAuthenticated={handleAuthSuccess}
                    context={authContext}
                    onExitWithoutSaving={() => {
                        setAuthContext(null);
                        window.location.href = '/'; // Actually exit
                    }}
                />
            )}
        </div>
    );
}
