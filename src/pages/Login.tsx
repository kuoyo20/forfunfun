import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Star, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const Login = () => {
  const { user, loading, signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={24} />
      </div>
    );
  }

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === 'register') {
        await signUp(email, password, displayName || email);
      } else {
        await signIn(email, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失敗');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
            <Star className="text-primary-foreground" size={26} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">苗林行業務系統</h1>
            <p className="text-xs text-muted-foreground">讓品味與食俱進</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-card rounded-xl border border-border shadow-sm p-6">
          <h2 className="text-base font-bold text-foreground text-center mb-5">
            {mode === 'login' ? '登入系統' : '註冊帳號'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">姓名</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="例：王小明"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">密碼</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="至少 6 個字元"
                required
                minLength={6}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
              />
            </div>

            {error && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60 mt-2"
            >
              {submitting ? '處理中...' : (mode === 'login' ? '登入' : '註冊')}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); }}
              className="text-sm text-primary hover:underline"
            >
              {mode === 'login' ? '還沒有帳號？點此註冊' : '已有帳號？點此登入'}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          © {new Date().getFullYear()} Miaolin Foods
        </p>
      </div>
    </div>
  );
};

export default Login;
