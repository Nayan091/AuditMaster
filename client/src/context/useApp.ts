import { useContext } from "react";
import { AppContext } from "./appContext";

export function useApp(){
    const context = useContext(AppContext);
    if (!context) throw new Error("UseApp must be used within AppProvider");
    return context;
}