'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Editor from '@monaco-editor/react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import AuthModal from '@/components/AuthModal';
import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { MonacoBinding } from 'y-monaco';

export default function CodeEditor() {
    const params = useParams();
    const roomId = params?.roomId as string;

    const editorRef = useRef<any>(null);
    const stompClientRef = useRef<Client | null>(null);
    const ydocRef = useRef<Y.Doc | null>(null);
    const providerRef = useRef<WebrtcProvider | null>(null);
    const bindingRef = useRef<MonacoBinding | null>(null);

    // API base: prefer NEXT_PUBLIC_API_BASE at build time, fallback to current origin in browser
    const API_BASE: string = (typeof window !== 'undefined')
        ? (process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080')
        : (process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080');
    
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
    const [mobileTab, setMobileTab] = useState<'editor' | 'terminal' | 'chat'>('editor');

    const isSyncEnabledRef = useRef(true);
    const [isSyncEnabled, setIsSyncEnabledState] = useState(true);

    const toggleSync = () => {
        const newState = !isSyncEnabled;
        setIsSyncEnabledState(newState);
        isSyncEnabledRef.current = newState;
    };

    const messagesEndRef = useRef<HTMLDivElement>(null);
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
                // Subscribe to room topic for language changes only
                stompClient.subscribe(`/topic/document/${roomId}`, (message) => {
                    const payload = JSON.parse(message.body);

                    if (payload.type === 'language') {
                        if (payload.language && payload.language !== language) {
                            if (!isSyncEnabledRef.current) return;
                            setLanguage(payload.language);
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
            },
        });

        stompClient.activate();
        stompClientRef.current = stompClient;

        return () => {
            stompClient.deactivate();
        };
    }, [roomId]);

    useEffect(() => {
        return () => {
            if (bindingRef.current) bindingRef.current.destroy();
            if (providerRef.current) providerRef.current.destroy();
            if (ydocRef.current) ydocRef.current.destroy();
        };
    }, []);

    function handleEditorDidMount(editor: any, monaco: any) {
        editorRef.current = editor;
        monacoRef.current = monaco;

        // Initialize Yjs Document and WebRTC Provider
        const ydoc = new Y.Doc();
        ydocRef.current = ydoc;

        // The signaling server URL is configured to point to our Spring Boot backend
        const signalingUrl = (typeof window !== 'undefined')
            ? (process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE || `ws://${window.location.hostname}:8080`).replace(/^http/, 'ws') + '/api/signaling'
            : 'ws://localhost:8080/api/signaling';
            
        const provider = new WebrtcProvider(roomId, ydoc, { 
            signaling: [signalingUrl] 
        });
        providerRef.current = provider;

        // Set local user awareness state for cursor tracking
        provider.awareness.setLocalStateField('user', {
            name: localUser.name,
            color: '#30bced', // default color, could be generated based on name
            emoji: localUser.emoji
        });

        // Bind Monaco to Yjs
        const ytext = ydoc.getText('monaco');
        const binding = new MonacoBinding(ytext, editorRef.current.getModel(), new Set([editorRef.current]), provider.awareness);
        bindingRef.current = binding;

        // Inject pre-fetched content if it arrived before the editor finished loading and Yjs document is empty
        if (initialContentFetched.current && ytext.toString() === '') {
            ytext.insert(0, initialContentFetched.current);
            initialContentFetched.current = null;
        }
    }

    // handleEditorChange is now handled entirely by y-monaco. We only keep it around for the interface if needed.
    function handleEditorChange(value: string | undefined) {
        // Yjs automatically syncs text changes. No STOMP publishing needed.
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
        <div className={`app-container flex flex-col h-screen bg-[var(--background)] ${theme !== 'light' ? 'dark-theme' : ''}`}>
            {/* Top Navigation */}
            <header className="flex items-center justify-between h-[60px] md:h-[72px] px-4 md:px-6 bg-[var(--surface)] border-b border-[var(--border)] text-[var(--text-primary)] z-10 shrink-0 gap-4 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                <div className="flex items-center gap-4 shrink-0">
                    <img height = "40px" width = "40px" src = "favicon.ico"/>
                    <h3 className="m-0 text-lg font-semibold tracking-tight flex items-center">
                        CodeSync <span className="text-[var(--border)] mx-2">|</span>
                        <span className="text-[var(--text-secondary)] text-sm font-mono">
                            {roomId?.substring(0, 8).toUpperCase()}
                        </span>
                        <button onClick={copyShareLink} className="ml-2 bg-transparent border-none cursor-pointer text-[var(--text-muted)]" title="Copy URL">
                            ⧉
                        </button>
                    </h3>

                    <div className="hidden sm:flex items-center gap-1.5 ml-2 pl-4 border-l border-[var(--border)]">
                        {activeUsers.map(user => (
                            <div
                                key={user.id}
                                className="user-avatar relative flex items-center justify-center w-7 h-7 rounded-full bg-[var(--surface-secondary)] border border-[var(--border)] text-sm cursor-help"
                            >
                                {user.emoji}
                                <span className="user-tooltip">{user.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex gap-3 items-center shrink-0">
                    <select
                        value={language}
                        onChange={handleLanguageChange}
                        className="py-1.5 px-3 rounded-lg bg-[var(--surface-secondary)] text-[var(--text-primary)] border border-[var(--border)] outline-none cursor-pointer text-[13px] font-medium"
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
                        className="py-1.5 px-3 rounded-lg bg-[var(--surface-secondary)] text-[var(--text-primary)] border border-[var(--border)] outline-none cursor-pointer text-[13px] font-medium"
                    >
                        <option value="light">Light Theme</option>
                        <option value="vs-dark">Dark Theme</option>
                        <option value="hc-black">High Contrast</option>
                    </select>
                </div>

                <div className="flex gap-4 items-center shrink-0">
                    <button
                        onClick={toggleSync}
                        className={`bg-transparent border-none cursor-pointer text-[13px] font-semibold flex items-center gap-1.5 ${isSyncEnabled ? 'text-[var(--success)]' : 'text-[var(--text-muted)]'}`}>
                        <span className={`w-2 h-2 rounded-full ${isSyncEnabled ? 'bg-[var(--success)]' : 'bg-[var(--border)]'}`}></span>
                        Sync: {isSyncEnabled ? 'ON' : 'OFF'}
                    </button>

                    <button
                        onClick={runCode}
                        disabled={isRunning || language === 'plaintext'}
                        className={`border-none py-2 px-5 rounded-lg text-sm font-semibold transition-colors duration-150 ${isRunning || language === 'plaintext' ? 'bg-[var(--surface-secondary)] text-[var(--text-muted)] cursor-not-allowed' : 'bg-[var(--accent)] text-white cursor-pointer'}`}>
                        {isRunning ? 'Running...' : 'Run Code'}
                    </button>

                    <button
                        onClick={copyShareLink}
                        className="hidden md:block bg-[var(--surface)] text-[var(--text-primary)] border border-[var(--border)] py-2 px-4 rounded-lg cursor-pointer text-sm font-medium transition-colors duration-150">
                        {copied ? 'Copied' : '↗ Share URL'}
                    </button>

                    <button
                        onClick={handlePastConvo}
                        className="hidden md:block bg-[var(--surface-secondary)] text-[var(--accent)] border border-[var(--accent)] py-2 px-4 rounded-lg cursor-pointer text-sm font-semibold transition-colors duration-150">
                        Past Convo
                    </button>

                    <button
                        onClick={handleExit}
                        className="bg-transparent text-[#e53935] border border-[#e53935] py-2 px-4 rounded-lg cursor-pointer text-sm font-semibold transition-colors duration-150">
                        Exit & Save
                    </button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden relative">
                {/* Desktop Left Nav */}
                <aside className="hidden md:flex flex-col items-center w-[72px] bg-[var(--surface)] border-r border-[var(--border)] py-6 gap-4 shrink-0">
                    <button className="w-11 h-11 rounded-lg bg-[var(--accent-soft)] text-[var(--accent)] border-none text-xl cursor-pointer" title="Code">
                        ⌨️
                    </button>
                    <button className="w-11 h-11 rounded-lg bg-transparent text-[var(--text-secondary)] border-none text-xl cursor-pointer invisible" title="Files">
                        📁
                    </button>
                    <button className="w-11 h-11 rounded-lg bg-transparent text-[var(--text-secondary)] border-none text-xl cursor-pointer invisible" title="Settings">
                        ⚙️
                    </button>
                </aside>

                {/* Middle Column (Editor + Terminal) */}
                <div className={`flex-1 flex-col min-w-0 overflow-hidden bg-[var(--background)] ${(mobileTab === 'editor' || mobileTab === 'terminal') ? 'flex' : 'hidden md:flex'}`}>
                    
                    {/* Editor Wrapper */}
                    <div className={`flex-1 p-4 md:p-6 flex-col min-h-0 ${mobileTab === 'editor' ? 'flex' : 'hidden md:flex'}`}>
                        <div className="flex border-b border-[var(--border)] pb-2 mb-4 shrink-0">
                            <div className="text-[13px] font-medium text-[var(--text-primary)] flex items-center gap-2">
                                <span className="text-[var(--accent)] font-mono">{langInfo.icon}</span> {langInfo.ext}
                            </div>
                        </div>

                        <div className="flex-1 rounded-2xl overflow-hidden border border-[var(--border)] shadow-sm bg-[var(--surface)]">
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

                    {/* Terminal Wrapper */}
                    <div className={`p-4 pt-0 md:px-6 md:pb-6 md:pt-0 shrink-0 flex-col md:h-[30%] ${mobileTab === 'terminal' ? 'flex flex-1 pt-4' : 'hidden md:flex'}`}>
                        <div className="flex-1 flex flex-col bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm">
                            <div className="py-3 px-4 border-b border-[var(--border-subtle)] flex gap-4">
                                <button
                                    onClick={() => setTerminalMode('input')}
                                    className={`bg-transparent border-none text-xs font-bold tracking-wide cursor-pointer p-0 ${terminalMode === 'input' ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`}
                                >
                                    STDIN (INPUT)
                                </button>
                                <button
                                    onClick={() => setTerminalMode('output')}
                                    className={`bg-transparent border-none text-xs font-bold tracking-wide cursor-pointer p-0 ${terminalMode === 'output' ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`}
                                >
                                    OUTPUT
                                </button>
                            </div>

                            {terminalMode === 'input' ? (
                                <textarea
                                    value={stdin}
                                    onChange={(e) => setStdin(e.target.value)}
                                    placeholder="Enter your upfront standard input here..."
                                    className="flex-1 p-4 bg-transparent text-[var(--text-primary)] border-none resize-none outline-none font-mono text-[13px] leading-relaxed"
                                />
                            ) : (
                                <div className="flex-1 p-4 overflow-y-auto font-mono text-[var(--text-secondary)] whitespace-pre-wrap text-[13px] leading-relaxed">
                                    {output || 'No output yet'}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Chat Sidebar */}
                <div className={`flex-col w-full md:w-[320px] bg-[var(--surface)] border-l border-[var(--border)] shrink-0 ${mobileTab === 'chat' ? 'flex' : 'hidden md:flex'}`}>
                    <div className="p-6 pb-4 flex justify-between items-center shrink-0">
                        <span className="text-[13px] font-semibold text-[var(--text-primary)]">PEER CHAT</span>
                        <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)]"></span>
                            <span className="text-xs text-[var(--text-secondary)]">{activeUsers.length} Online</span>
                        </div>
                    </div>

                    <div className="px-6 pb-4 flex gap-1.5 flex-wrap shrink-0">
                        {activeUsers.map(user => (
                            <div
                                key={user.id}
                                className="user-avatar relative flex items-center justify-center w-7 h-7 rounded-full bg-[var(--surface-secondary)] border border-[var(--border-subtle)] text-sm cursor-help"
                            >
                                {user.emoji}
                                <span className="user-tooltip">{user.name}</span>
                            </div>
                        ))}
                    </div>

                    <div className="flex-1 px-6 pb-6 overflow-y-auto flex flex-col gap-4">
                        {chatMessages.length === 0 ? (
                            <div className="text-[var(--text-muted)] text-center mt-10 text-[13px]">
                                No messages yet<br /><br />Say hello and start coding together.
                            </div>
                        ) : (
                            chatMessages.map((msg, i) => (
                                <div key={i} className="flex flex-col gap-1">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-sm">{msg.emoji}</span>
                                        <span className="text-xs font-semibold text-[var(--text-primary)]">{msg.sender}</span>
                                        <span className="text-[var(--text-muted)] text-[11px]">{msg.timestamp}</span>
                                    </div>
                                    <div className="text-[var(--text-primary)] text-[13px] bg-[var(--surface-secondary)] py-2.5 px-3 rounded-[0_12px_12px_12px] break-words leading-relaxed">
                                        {msg.text}
                                    </div>
                                </div>
                            ))
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <form onSubmit={sendChatMessage} className="p-4 md:px-6 md:py-4 border-t border-[var(--border-subtle)] flex gap-2 shrink-0">
                        <input
                            type="text"
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-1 py-2.5 px-3 bg-[var(--surface-secondary)] text-[var(--text-primary)] border border-[var(--border-subtle)] rounded-lg outline-none text-[13px]"
                        />
                        <button type="submit" disabled={!chatInput.trim()} className={`border-none rounded-lg w-9 h-9 flex items-center justify-center transition-colors duration-150 ${chatInput.trim() ? 'bg-[var(--accent)] text-white cursor-pointer' : 'bg-[var(--surface-secondary)] text-[var(--text-muted)] cursor-not-allowed'}`}>
                            ↑
                        </button>
                    </form>
                </div>
            </div>

            {/* Mobile Bottom Navigation */}
            <div className="md:hidden flex w-full min-h-[58px] bg-[var(--surface)] border-t border-[var(--border)] z-50 p-1.5 pb-[calc(6px+env(safe-area-inset-bottom))] gap-1.5 shrink-0">
                <button 
                    onClick={() => setMobileTab('editor')}
                    className={`flex-1 flex flex-col items-center justify-center gap-1 rounded-[10px] text-xs font-medium border-none py-1 transition-colors duration-150 ${mobileTab === 'editor' ? 'text-[var(--accent)] bg-[var(--accent-soft)]' : 'text-[var(--text-secondary)] bg-transparent'}`}
                >
                    <span className="text-lg">⌨️</span>
                    Code
                </button>
                <button 
                    onClick={() => setMobileTab('terminal')}
                    className={`flex-1 flex flex-col items-center justify-center gap-1 rounded-[10px] text-xs font-medium border-none py-1 transition-colors duration-150 ${mobileTab === 'terminal' ? 'text-[var(--accent)] bg-[var(--accent-soft)]' : 'text-[var(--text-secondary)] bg-transparent'}`}
                >
                    <span className="text-lg">🖥️</span>
                    Run
                </button>
                <button 
                    onClick={() => setMobileTab('chat')}
                    className={`flex-1 flex flex-col items-center justify-center gap-1 rounded-[10px] text-xs font-medium border-none py-1 transition-colors duration-150 ${mobileTab === 'chat' ? 'text-[var(--accent)] bg-[var(--accent-soft)]' : 'text-[var(--text-secondary)] bg-transparent'}`}
                >
                    <span className="text-lg">💬</span>
                    Chat
                </button>
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
