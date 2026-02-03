import { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Dynamic backend detection
    const host = window.location.hostname;
    const backendUrl = `http://${host}:5000/api/auth`;

    useEffect(() => {
        const userInfo = JSON.parse(localStorage.getItem("userInfo"));
        if (userInfo) {
            setUser(userInfo);
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        const { data } = await axios.post(`${backendUrl}/login`, {
            email,
            password,
        });
        setUser(data);
        localStorage.setItem("userInfo", JSON.stringify(data));
    };

    const signup = async (name, email, password) => {
        const { data } = await axios.post(`${backendUrl}/signup`, {
            name,
            email,
            password,
        });
        setUser(data);
        localStorage.setItem("userInfo", JSON.stringify(data));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem("userInfo");
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
