"use client";
import { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import { CartContextType } from "@/types/cart-types";
import { cartReducer, initialCartState } from "./cartReducer";

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

    const [state, dispatch] = useReducer(cartReducer, initialCartState);

    // 1. Initial load from localStorage (happens immediately on mount)
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const savedCart = localStorage.getItem("sukiya_cart");
        if (savedCart) {
            try {
                const items = JSON.parse(savedCart);
                if (Array.isArray(items) && items.length > 0) {
                    dispatch({ type: "SET_ITEMS", payload: items });
                }
            } catch (e) {
                console.error("Failed to parse local cart:", e);
            }
        }
    }, []);

    // 3. Keep localStorage in sync (always)
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem("sukiya_cart", JSON.stringify(state.items));
        }
    }, [state.items]);

    const contextValue = useMemo(() => ({
        ...state,
        dispatch
    }), [state]);

    return (
        <CartContext.Provider value={contextValue}>
            {children}
        </CartContext.Provider>
    );

};

export const useCart = () => {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
}
