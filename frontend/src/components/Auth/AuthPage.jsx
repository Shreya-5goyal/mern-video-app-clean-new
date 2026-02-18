import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { User, Mail, Lock, ShieldCheck, ArrowRight, Video, Loader2, Sparkles, Zap, Globe } from "lucide-react";
import "./Auth.css";

const AuthPage = () => {
    const [isLogin, setIsLogin] = useState(false);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { login, signup } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);
        try {
            // Add a small artificial delay for smoother UX if the backend is too fast, 
            // or to show the loading state if the backend is slow.
            // But we won't add artificial delay, just rely on actual network.
            if (isLogin) {
                await login(email, password);
            } else {
                await signup(name, email, password);
            }
        } catch (err) {
            setError(err.response?.data?.message || "Invalid credentials. Please try again.");
            setIsLoading(false);
        }
    };

    const toggleMode = () => {
        setIsLogin(!isLogin);
        setError("");
        setName("");
        setEmail("");
        setPassword("");
    };

    return (
        <div className="auth-container">
            <div className="auth-wrapper glass-morphism">
                {/* Left Side - Hero/Branding */}
                <div className="auth-hero">
                    <div className="hero-content">
                        <div className="hero-badge">
                            <Sparkles size={16} />
                            <span>AI-Powered Communication</span>
                        </div>
                        <h1 className="hero-title">
                            Connect beyond <br />
                            <span className="gradient-text">boundaries.</span>
                        </h1>
                        <p className="hero-desc">
                            Experience the next generation of video conferencing with real-time AI analytics,
                            secure encryption, and crystal clear quality.
                        </p>

                        <div className="hero-features">
                            <div className="feature-item">
                                <div className="feature-icon">
                                    <Zap size={20} />
                                </div>
                                <div className="feature-text">
                                    <h3>Zero Latency</h3>
                                    <p>Instant connection worldwide</p>
                                </div>
                            </div>
                            <div className="feature-item">
                                <div className="feature-icon">
                                    <ShieldCheck size={20} />
                                </div>
                                <div className="feature-text">
                                    <h3>Enterprise Security</h3>
                                    <p>End-to-end encrypted calls</p>
                                </div>
                            </div>
                            <div className="feature-item">
                                <div className="feature-icon">
                                    <Globe size={20} />
                                </div>
                                <div className="feature-text">
                                    <h3>Global Access</h3>
                                    <p>Connect from anywhere</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Abstract Shapes for Background */}
                    <div className="circle circle-1"></div>
                    <div className="circle circle-2"></div>
                </div>

                {/* Right Side - Form */}
                <div className="auth-form-container">
                    <div className="auth-header">
                        <div className="logo-icon">
                            <Video size={28} />
                        </div>
                        <h2>{isLogin ? "Welcome Back" : "Create Account"}</h2>
                        <p>{isLogin ? "Enter your credentials to access your workspace." : "Get started with your free account today."}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="auth-form">
                        {!isLogin && (
                            <div className="form-group">
                                <label>Full Name</label>
                                <div className="input-group">
                                    <User size={18} className="input-icon" />
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="John Doe"
                                        required
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="form-group">
                            <label>Email Address</label>
                            <div className="input-group">
                                <Mail size={18} className="input-icon" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="name@company.com"
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Password</label>
                            <div className="input-group">
                                <Lock size={18} className="input-icon" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="auth-error">
                                <ShieldCheck size={16} />
                                <span>{error}</span>
                            </div>
                        )}

                        <button type="submit" className="btn-primary full-width" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 size={20} className="animate-spin" />
                                    <span>Processing...</span>
                                </>
                            ) : (
                                <>
                                    <span>{isLogin ? "Sign In" : "Create Account"}</span>
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="auth-footer">
                        <p>
                            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                            <button type="button" onClick={toggleMode} className="text-link" disabled={isLoading}>
                                {isLogin ? "Sign up" : "Log in"}
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthPage;
