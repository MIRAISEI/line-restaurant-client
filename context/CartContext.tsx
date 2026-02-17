"use client";
import { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { CartContextType } from "@/types/cart-types";
import { cartReducer, initialCartState } from "./cartReducer";
import { useAuth } from "@/lib/auth-context";
import { getCart, syncCart } from "@/lib/admin-api";

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

    const [state, dispatch] = useReducer(cartReducer, initialCartState);
    const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
    const [hasLoaded, setHasLoaded] = useState(false);
    const prevItemsRef = useRef(state.items);

    // 1. Initial load from localStorage (happens immediately on mount)
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const savedCart = localStorage.getItem("sukiya_cart");
        if (savedCart) {
            try {
                const items = JSON.parse(savedCart);
                if (Array.isArray(items) && items.length > 0) {
                    dispatch({ type: "SET_ITEMS", payload: items });
                    prevItemsRef.current = items;
                }
            } catch (e) {
                console.error("Failed to parse local cart:", e);
            }
        }

        // If not authenticated, we're "loaded" as a guest
        if (!isAuthLoading && !isAuthenticated) {
            setHasLoaded(true);
        }
    }, [isAuthLoading, isAuthenticated]);

    // 2. Load from DB when user becomes authenticated
    useEffect(() => {
        if (isAuthLoading) return;

        if (isAuthenticated && user?.userId) {
            const loadDbCart = async () => {
                console.log("Fetching cart from DB for:", user.userId);
                const dbItems = await getCart();

                if (dbItems && dbItems.length > 0) {
                    // DB items take precedence over local storage on login/refresh
                    dispatch({ type: "SET_ITEMS", payload: dbItems });
                    prevItemsRef.current = dbItems;
                }
                setHasLoaded(true);
            };
            loadDbCart();
        } else if (!isAuthLoading) {
            setHasLoaded(true);
        }
    }, [isAuthenticated, user?.userId, isAuthLoading]);

    // 3. Keep localStorage in sync (always)
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem("sukiya_cart", JSON.stringify(state.items));
        }
    }, [state.items]);

    // 4. Sync to DB whenever items change (only after initial load)
    useEffect(() => {
        if (!hasLoaded) return;
        if (!isAuthenticated || !user?.userId) return;

        // Skip if items haven't changed since last sync/load
        const itemsJson = JSON.stringify(state.items);
        const prevJson = JSON.stringify(prevItemsRef.current);
        if (itemsJson === prevJson) return;

        const timer = setTimeout(async () => {
            console.log("Syncing cart to DB...");
            const result = await syncCart(state.items);
            if (result.success) {
                prevItemsRef.current = state.items;
            }
        }, 1500); // 1.5s debounce to be safe

        return () => clearTimeout(timer);
    }, [state.items, isAuthenticated, user?.userId, hasLoaded]);

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