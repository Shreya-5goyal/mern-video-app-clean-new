import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import "./Auth.css";

const AuthPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const { login, signup } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        try {
            if (isLogin) {
                await login(email, password);
            } else {
                await signup(name, email, password);
            }
        } catch (err) {
            setError(err.response?.data?.message || "Invalid credentials. Please try again.");
        }
    };

    return (
        <div className="auth-container fade-in">
            <div className="premium-bg"></div>

            <div className="auth-card glass-effect">
                <div className="auth-header">
                    <div className="brand-name" style={{ fontSize: '32px', marginBottom: '10px' }}>VideoConnect</div>
                    <p style={{ color: 'var(--text-dim)', fontSize: '15px' }}>{isLogin ? "Sign in to your professional workspace" : "Create your high-definition account"}</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    {!isLogin && (
                        <div className="form-group">
                            <label>Professional Name</label>
                            <input
                                type="text"
                                className="home-input"
                                style={{ fontSize: '15px', padding: '14px 20px' }}
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Alexander Pierce"
                                required
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <label>Work Email</label>
                        <input
                            type="email"
                            className="home-input"
                            style={{ fontSize: '15px', padding: '14px 20px' }}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="name@company.com"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Secure Password</label>
                        <input
                            type="password"
                            className="home-input"
                            style={{ fontSize: '15px', padding: '14px 20px' }}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••••••"
                            required
                        />
                    </div>

                    {error && <div className="auth-error">{error}</div>}

                    <button type="submit" className="btn-premium btn-join" style={{ width: '100%', marginTop: '10px' }}>
                        {isLogin ? "Continue to Meetings" : "Initialize Account"}
                    </button>
                </form>

                <div className="auth-footer" style={{ marginTop: '30px', borderTop: '1px solid var(--glass-border)', paddingTop: '20px' }}>
                    <p style={{ fontSize: '14px', color: 'var(--text-dim)' }}>
                        {isLogin ? "New to the platform?" : "Already have an account?"}{" "}
                        <span
                            onClick={() => { setIsLogin(!isLogin); setError(''); }}
                            style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 700 }}
                        >
                            {isLogin ? "Register Now" : "Sign In"}
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AuthPage;
