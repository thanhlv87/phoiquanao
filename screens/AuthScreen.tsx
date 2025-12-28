
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Icon } from '../components/Icon';

type AuthMode = 'login' | 'signup';

export const AuthScreen: React.FC = () => {
    const [mode, setMode] = useState<AuthMode>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    
    const navigate = useNavigate();
    const location = useLocation();
    const { signInWithEmail, signUpWithEmail, loginAnonymously, user, error: authError, clearError } = useAuth();

    useEffect(() => {
        if (user) {
            const origin = (location.state as any)?.from?.pathname || '/';
            navigate(origin);
        }
    }, [user, navigate, location]);

    useEffect(() => {
        clearError();
    }, [mode, clearError]);

    const handleAuthAction = async (action: () => Promise<void>) => {
        setLoading(true);
        try {
            await action();
        } catch (e) {
            console.error("Auth error:", e);
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

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 animate-fade-in relative overflow-hidden">
            {/* Trang trí nền - Giảm độ đục để không làm mờ form chính */}
            <div className="absolute top-[-10%] left-[-10%] w-[60%] aspect-square bg-indigo-100/30 rounded-full blur-[100px] -z-10 animate-pulse"></div>
            <div className="absolute bottom-[-5%] right-[-5%] w-[50%] aspect-square bg-purple-100/30 rounded-full blur-[80px] -z-10"></div>

            <div className="w-full max-w-sm bg-white p-8 rounded-[3rem] shadow-2xl shadow-indigo-100/50 border border-white">
                <div className="text-center mb-10">
                    <div className="w-20 h-20 mx-auto mb-4 animate-scale-up">
                        <img 
                            src="https://raw.githubusercontent.com/thanhlv87/pic/refs/heads/main/fashion.png" 
                            alt="Logo" 
                            className="w-full h-full object-contain drop-shadow-lg"
                        />
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic leading-none mb-2">Fashion Mix</h1>
                    <p className="text-slate-400 font-bold text-[9px] uppercase tracking-[0.2em]">Nhật ký phong cách AI</p>
                </div>

                <div className="bg-slate-100 p-1 rounded-2xl flex mb-8">
                    <button
                        onClick={() => setMode('login')}
                        className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all rounded-xl ${mode === 'login' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Đăng nhập
                    </button>
                    <button
                        onClick={() => setMode('signup')}
                        className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all rounded-xl ${mode === 'signup' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Đăng ký
                    </button>
                </div>
                
                {authError && (
                    <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl mb-6 text-[10px] font-bold flex items-start gap-3 animate-slide-up">
                        <Icon name="trash" className="w-4 h-4 flex-shrink-0" />
                        <p>{authError}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-3">
                        <div className="relative group">
                            <Icon name="mail" className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                            <input
                                type="email"
                                placeholder="Email của bạn"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all text-sm font-semibold text-slate-900 placeholder-slate-400"
                            />
                        </div>
                        <div className="relative group">
                            <Icon name="lock" className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                            <input
                                type="password"
                                placeholder="Mật khẩu"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all text-sm font-semibold text-slate-900 placeholder-slate-400"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 text-white font-black py-5 rounded-2xl shadow-lg shadow-indigo-100 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center uppercase text-[10px] tracking-[0.2em]"
                    >
                        {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : (mode === 'login' ? 'Truy cập ngay' : 'Bắt đầu hành trình')}
                    </button>
                </form>

                <div className="relative my-8 text-center">
                    <button 
                        onClick={() => handleAuthAction(loginAnonymously)} 
                        disabled={loading}
                        className="py-2 text-[10px] font-black text-slate-400 hover:text-indigo-600 transition-all uppercase tracking-[0.2em]"
                    >
                        Dùng thử nhanh không cần tài khoản
                    </button>
                </div>
            </div>
            
            <footer className="mt-12 text-[9px] text-slate-400 font-bold uppercase tracking-widest text-center">
                By Gemini & ThanhLV87
            </footer>
        </div>
    );
};
