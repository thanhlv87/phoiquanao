import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Icon } from '../components/Icon';

type AuthMode = 'login' | 'signup';

export const AuthScreen: React.FC = () => {
    const [mode, setMode] = useState<AuthMode>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    
    const navigate = useNavigate();
    const { loginWithGoogle, signInWithEmail, signUpWithEmail, user, error: authError, clearError } = useAuth();

    useEffect(() => {
        // If the user is already logged in (and not an anonymous user), redirect to home.
        // This handles the case after a successful Google sign-in redirect.
        if (user && !user.isAnonymous) {
            navigate('/');
        }
    }, [user, navigate]);

    // When switching modes, clear any existing auth error.
    useEffect(() => {
        clearError();
    }, [mode, clearError]);

    const handleAuthAction = async (action: () => Promise<void>) => {
        setLoading(true);
        try {
            await action();
            // On success, the user state will change via onAuthStateChanged,
            // and the first useEffect will redirect to the home page.
        } catch (e) {
            // The error is already set in the auth context by the hook.
            // We just need to stop the loading indicator here.
            console.error("Authentication action failed:", e);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (mode === 'login') {
            handleAuthAction(() => signInWithEmail(email, password));
        } else {
            handleAuthAction(() => signUpWithEmail(email, password));
        }
    };

    const handleGoogleSignIn = () => {
        handleAuthAction(loginWithGoogle);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-slate-100 p-4">
            <div className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl p-8">
                <div className="text-center mb-8">
                    <img src="https://cdn-icons-png.flaticon.com/512/3050/3050253.png" alt="App Logo" className="w-16 h-16 mx-auto mb-4" />
                    <h1 className="text-3xl font-bold text-gray-800">Chào mừng</h1>
                    <p className="text-gray-500">{mode === 'login' ? 'Đăng nhập để tiếp tục' : 'Tạo tài khoản để bắt đầu'}</p>
                </div>

                <div className="flex border-b border-gray-200 mb-6">
                    <button
                        onClick={() => setMode('login')}
                        className={`w-1/2 py-3 text-sm font-semibold transition-colors ${mode === 'login' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500'}`}
                    >
                        Đăng nhập
                    </button>
                    <button
                        onClick={() => setMode('signup')}
                        className={`w-1/2 py-3 text-sm font-semibold transition-colors ${mode === 'signup' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500'}`}
                    >
                        Đăng ký
                    </button>
                </div>
                
                {authError && <p className="bg-red-100 text-red-700 text-center p-3 rounded-lg mb-4 text-sm">{authError}</p>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative">
                        <Icon name="mail" className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="email"
                            placeholder="Địa chỉ Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full pl-10 pr-3 py-3 bg-gray-100 text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>
                    <div className="relative">
                        <Icon name="lock" className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="password"
                            placeholder="Mật khẩu"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full pl-10 pr-3 py-3 bg-gray-100 text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-glow-lg transition-all duration-300 disabled:opacity-50 flex items-center justify-center transform hover:scale-105"
                    >
                        {loading ? <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div> : (mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản')}
                    </button>
                </form>

                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="bg-white px-2 text-gray-500">Hoặc tiếp tục với</span>
                    </div>
                </div>

                <button
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 bg-white/80 backdrop-blur-xl text-gray-700 font-semibold py-3 px-4 rounded-xl shadow-lg hover:shadow-xl hover:bg-white transition-all duration-300 border border-gray-200 disabled:opacity-50 transform hover:scale-105"
                >
                    <Icon name="google" className="w-5 h-5" />
                    <span>Đăng nhập với Google</span>
                </button>
            </div>
             <button onClick={() => navigate('/')} className="mt-8 text-sm text-gray-600 hover:text-purple-600 transition-colors">
                Tiếp tục với tư cách khách
            </button>
        </div>
    );
};