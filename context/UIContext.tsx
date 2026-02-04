"use client";
import { UIContextType } from "@/types/ui-types";
import { createContext, useContext, useMemo, useState } from "react";


const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{children:React.ReactNode}> = ({children}) => {

    const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);

    const contextValue = useMemo(()=>({
        isCartDrawerOpen,
        setIsCartDrawerOpen,
    }),[isCartDrawerOpen]);

    return(
        <UIContext.Provider value={contextValue}>{children}</UIContext.Provider>
    )

};

export const useUI = () => {
    const context = useContext(UIContext);
    if(context === undefined){
        throw new Error("useUI must be used within a UIProvider");
    }
    return context;
};