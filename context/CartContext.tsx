"use client";
import { createContext, useContext, useMemo, useReducer } from "react";
import { CartContextType } from "@/types/cart-types";
import { cartReducer, initialCartState } from "./cartReducer";

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider:React.FC<{ children:React.ReactNode }> = ({children}) => {

    const [state, dispatch] = useReducer(cartReducer, initialCartState);

    const contextValue = useMemo(()=>({
        ...state,
        dispatch
    }),[state]);

    return (
        <CartContext.Provider value={contextValue}>
            {children}
        </CartContext.Provider>
    );

};

export const useCart = ()=> {
    const context = useContext(CartContext);
    if(context === undefined){
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
}