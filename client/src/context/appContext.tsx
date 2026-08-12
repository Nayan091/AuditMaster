import type { AxiosInstance } from "axios";
import axios, { type AxiosError } from "axios";
import { createContext, useEffect, useState, type ReactNode } from "react";

import { useMemo } from "react"; // add to your React import


interface User{
    name:string;
    email:string;
    plan:string;
    analysisCount?:number;
}

interface AppContextType{
    user : User | null;
    token : string | null;
    loading : boolean;
    api : AxiosInstance;
    login:(email:string,password:string)=> Promise<{success:boolean; message?:string}>
    register:(name:string,email:string,password:string)=> Promise<{success:boolean; message?:string}>
    logout : ()=> void;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

// eslint-disable-next-line react-refresh/only-export-components
export const AppContext = createContext <AppContextType | undefined>(undefined)

export function AppProvider({children}:{children: ReactNode}){
    const [user, setUser] = useState<User | null>(null)
    const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
    const [loading, setLoading] = useState(true);

    // Axios interface with auth header
    // const api= axios.create({
    //     baseURL: BACKEND_URL,
    // })
    const api = useMemo(() => {
    const instance = axios.create({ baseURL: BACKEND_URL });
    instance.interceptors.request.use((config) => {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    });
    return instance;
    }, []);

    const loadUser = async () => {
        if (!token) {
            setLoading(false);
            return;
        }
        try {
            const {data} = await api.get('/api/auth/user')
            if (data.success) {
                setUser(data.user)
            }
        } catch {
            localStorage.removeItem("token");
            setToken(null)
            setUser(null)
        }
        setLoading(false)
    }

    useEffect(()=>{
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadUser();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    },[])

    const login = async (email:string,password:string) => {
        try {
            const res = await axios.post(`${BACKEND_URL}/api/auth/login`,{email,password})
            if (res.data.success) {
                setToken(res.data.token)
                setUser(res.data.user)
                localStorage.setItem("token",res.data.token)
                return {success : true}
            }
            return {success:false , message : res.data.message}
        } catch (error) {
            const err = error as AxiosError<{ message?: string }>;
            return {success:false , message : err.response?.data?.message || "Login Failed"}
        }
    }
    const register = async (name:string,email:string,password:string) => {
        try {
            const res = await axios.post(`${BACKEND_URL}/api/auth/register`,{name,email,password})
            if (res.data.success) {
                setToken(res.data.token)
                setUser(res.data.user)
                localStorage.setItem("token",res.data.token)
                return {success : true}
            }
            return {success:false , message : res.data.message}
        } catch (error) {
            const err = error as AxiosError<{ message?: string }>;
            return {success:false , message : err.response?.data?.message || "Login Failed"}
        }
    }
    const logout = async () => {
        setToken(null)
        setUser(null)
        localStorage.removeItem("token")
    }

    const value = {user, token, loading, api, login,register,logout}
    return <AppContext.Provider value={value}>
        {children}
    </AppContext.Provider>
}