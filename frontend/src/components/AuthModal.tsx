import React, { useState } from 'react';

interface AuthModalProps {
    onClose: () => void;
    onAuthenticated: (username: string) => void;
    onExitWithoutSaving?: () => void;
    context: 'save' | 'load';
}

export default function AuthModal({ onClose, onAuthenticated, onExitWithoutSaving, context }: AuthModalProps) {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // Unified Auth: Try to register first. If conflict (409), try to login.
            let res = await fetch(`http://localhost:8080/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ username, email: email || 'temp@test.com', password }) // Email optional for login attempt
            });

            if (res.status === 409) {
                // Username exists, try login
                res = await fetch(`http://localhost:8080/api/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ username, password })
                });
            }

            if (res.ok) {
                onAuthenticated(username);
            } else {
                const errText = await res.text();
                setError(errText || 'Authentication failed. Please check your credentials.');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (showPrivacyPolicy) {
        return (
            <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001
            }}>
                <div style={{
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    borderRadius: '16px', padding: '32px', width: '500px', maxHeight: '80vh',
                    overflowY: 'auto', boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
                    color: 'var(--text-primary)', position: 'relative'
                }}>
                    <button 
                        onClick={() => setShowPrivacyPolicy(false)}
                        style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '20px' }}
                    >&times;</button>
                    <h2 style={{ margin: '0 0 16px', fontSize: '20px', fontWeight: '600' }}>Privacy Policy & Terms</h2>
                    <div style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
                        <h3 style={{ fontSize: '15px', color: 'var(--text-primary)', marginTop: '16px' }}>Commitment to Privacy</h3>
                        <p>CodeSync makes commercially reasonable efforts to maintain the privacy, confidentiality, and integrity of user data, including encrypted credential storage, secure session handling, and encrypted transport layers.</p>
                        
                        <h3 style={{ fontSize: '15px', color: 'var(--text-primary)', marginTop: '16px' }}>Limitation of Liability</h3>
                        <p><strong>No Absolute Guarantee:</strong> While we employ industry-standard security practices, no method of transmission over the internet or electronic storage is 100% secure. We cannot guarantee absolute security.</p>
                        <p><strong>External Attacks & Force Majeure:</strong> CodeSync, its maintainers, and its operators disclaim all liability for any unauthorized access, data breaches, data loss, or system compromises resulting from sophisticated external attacks, zero-day exploits, malicious threat actors, distributed denial-of-service (DDoS) events, or unforeseen infrastructure failures outside our reasonable control.</p>
                        <p><strong>User Acknowledgment:</strong> By utilizing CodeSync, users explicitly agree that the platform is provided on an "as-is" and "as-available" basis, and operators assume no legal liability for unforeseen security breaches caused by malicious third parties.</p>
                    </div>
                    <button 
                        onClick={() => setShowPrivacyPolicy(false)}
                        style={{ background: 'var(--surface-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', marginTop: '24px', width: '100%', fontWeight: '500' }}
                    >Close</button>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000
        }}>
            <div style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                padding: '32px',
                width: '420px',
                boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
                color: 'var(--text-primary)',
                position: 'relative',
                textAlign: 'center'
            }}>
                <button 
                    onClick={onClose}
                    style={{
                        position: 'absolute', top: '16px', right: '16px',
                        background: 'transparent', border: 'none',
                        color: 'var(--text-muted)', cursor: 'pointer', fontSize: '20px'
                    }}
                >
                    &times;
                </button>
                
                <h2 style={{ margin: '0 0 12px', fontSize: '24px', fontWeight: '600' }}>
                    {context === 'save' ? 'Save Your Workspace' : 'Restore Past Session'}
                </h2>
                <p style={{ margin: '0 0 24px', fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                    {context === 'save' 
                        ? 'Register or log in with your email, password, and a custom username to save your session data (code & chat history).'
                        : 'Enter your credentials to securely retrieve your previously saved workspace and chat history.'}
                </p>

                {error && (
                    <div style={{ background: 'rgba(255,0,0,0.1)', color: 'red', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Custom Username</label>
                        <input 
                            type="text" 
                            value={username} 
                            onChange={e => setUsername(e.target.value)}
                            required 
                            style={{
                                width: '100%', padding: '12px', borderRadius: '8px',
                                background: 'var(--surface-secondary)', border: '1px solid var(--border)',
                                color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box'
                            }}
                            placeholder="@dev_guru"
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Email</label>
                        <input 
                            type="email" 
                            value={email} 
                            onChange={e => setEmail(e.target.value)}
                            style={{
                                width: '100%', padding: '12px', borderRadius: '8px',
                                background: 'var(--surface-secondary)', border: '1px solid var(--border)',
                                color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box'
                            }}
                            placeholder="Optional for login"
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Password</label>
                        <input 
                            type="password" 
                            value={password} 
                            onChange={e => setPassword(e.target.value)}
                            required 
                            style={{
                                width: '100%', padding: '12px', borderRadius: '8px',
                                background: 'var(--surface-secondary)', border: '1px solid var(--border)',
                                color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', margin: '8px 0' }}>
                        By proceeding, you agree to our <span onClick={() => setShowPrivacyPolicy(true)} style={{ color: 'var(--accent)', cursor: 'pointer' }} title="View Privacy Policy">Privacy Policy</span>.
                    </div>

                    <button 
                        type="submit" 
                        disabled={isLoading}
                        style={{
                            background: 'var(--accent)', color: '#fff',
                            border: 'none', padding: '14px', borderRadius: '8px',
                            fontSize: '16px', fontWeight: '600', cursor: isLoading ? 'not-allowed' : 'pointer',
                            marginTop: '8px'
                        }}
                    >
                        {isLoading ? 'Processing...' : (context === 'save' ? 'Register / Login & Save' : 'Login & Restore')}
                    </button>
                    
                    {context === 'save' && (
                        <button
                            type="button"
                            onClick={onExitWithoutSaving}
                            style={{
                                background: 'transparent', color: 'var(--text-secondary)',
                                border: '1px solid var(--border)', padding: '12px', borderRadius: '8px',
                                fontSize: '15px', fontWeight: '500', cursor: 'pointer',
                                marginTop: '4px'
                            }}
                        >
                            Exit without saving
                        </button>
                    )}
                </form>
            </div>
        </div>
    );
}
