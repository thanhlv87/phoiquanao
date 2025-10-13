import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Icon } from '../components/Icon';
import { FirebaseError } from 'firebase/app';

type AuthMode = 'login' | 'signup';

export const AuthScreen: React.FC = () => {
    const [mode, setMode] = useState<AuthMode>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const navigate = useNavigate();
    const { loginWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();

    const getFriendlyErrorMessage = (errorCode: string) => {
        switch (errorCode) {
            case 'auth/user-not-found':
            case 'auth/wrong-password':
                return 'Email hoặc mật khẩu không hợp lệ. Vui lòng thử lại.';
            case 'auth/email-already-in-use':
                return 'Email này đã được liên kết với một tài khoản. Vui lòng đăng nhập.';
            case 'auth/weak-password':
                return 'Mật khẩu phải có ít nhất 6 ký tự.';
            case 'auth/invalid-email':
                return 'Vui lòng nhập một địa chỉ email hợp lệ.';
            default:
                return 'Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.';
        }
    };
    
    const handleAuthAction = async (action: () => Promise<void>) => {
        setLoading(true);
        setError('');
        try {
            await action();
            navigate('/');
        } catch (e) {
            if (e instanceof FirebaseError) {
                setError(getFriendlyErrorMessage(e.code));
            } else {
                setError('Đã xảy ra lỗi không mong muốn.');
            }
            console.error(e);
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
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
                <div className="text-center mb-8">
                    <img src="https://cdn-icons-png.flaticon.com/512/3050/3050253.png" alt="App Logo" className="w-16 h-16 mx-auto mb-4" />
                    <h1 className="text-3xl font-bold text-gray-800">Chào mừng</h1>
                    <p className="text-gray-500">{mode === 'login' ? 'Đăng nhập để tiếp tục' : 'Tạo tài khoản để bắt đầu'}</p>
                </div>

                <div className="flex border-b border-gray-200 mb-6">
                    <button
                        onClick={() => setMode('login')}
                        className={`w-1/2 py-3 text-sm font-semibold transition-colors ${mode === 'login' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                    >
                        Đăng nhập
                    </button>
                    <button
                        onClick={() => setMode('signup')}
                        className={`w-1/2 py-3 text-sm font-semibold transition-colors ${mode === 'signup' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                    >
                        Đăng ký
                    </button>
                </div>
                
                {error && <p className="bg-red-100 text-red-700 text-center p-3 rounded-lg mb-4 text-sm">{error}</p>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative">
                        <Icon name="mail" className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="email"
                            placeholder="Địa chỉ Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full pl-10 pr-3 py-3 bg-gray-100 text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                            className="w-full pl-10 pr-3 py-3 bg-gray-100 text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg shadow-md hover:bg-blue-700 transition-colors disabled:bg-blue-300 flex items-center justify-center"
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
                    className="w-full flex items-center justify-center gap-2 bg-white text-gray-700 font-semibold py-3 px-4 rounded-lg shadow-md hover:bg-gray-100 transition-colors border border-gray-200 disabled:opacity-50"
                >
                    <Icon name="google" className="w-5 h-5" />
                    <span>Đăng nhập với Google</span>
                </button>
            </div>
             <button onClick={() => navigate('/')} className="mt-8 text-sm text-gray-600 hover:text-blue-600">
                Tiếp tục với tư cách khách
            </button>
        </div>
    );
};