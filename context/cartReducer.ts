import { CartAction, CartState, ICartItem } from "@/types/cart-types";
import { useReducer } from "react";

const calculateItemTotal = (item: ICartItem): number => {
    const itemTotal = item.totalAmount;
    const addonsTotal = item.addons?.reduce((sum, addon) => sum + addon.totalAmount, 0) || 0;
    return itemTotal + addonsTotal;
};

const calculateTotals = (items:ICartItem[]): {totalCartAmount:number} => {
    const totalCartAmount = items.reduce((total, item)=> total + calculateItemTotal(item), 0);
    return {totalCartAmount};
}

export const initialCartState: CartState = {
    items: [],
    totalCartAmount:0,
}

export const cartReducer = (state:CartState, action:CartAction): CartState => {
    switch(action.type){
        case "ADD_ITEM" : {
            const newItem = action.payload;
            const existingItemIndex = state.items.findIndex(item => item.id === newItem.id);
            if(existingItemIndex > -1){
                const updatedItems = [...state.items];
                const existingItem = updatedItems[existingItemIndex];

                const updatedItem:ICartItem = {
                    ...existingItem,
                    quantity: existingItem.quantity + newItem.quantity,
                    totalAmount: existingItem.totalAmount + newItem.totalAmount
                }
                updatedItems[existingItemIndex] = updatedItem;
                return{
                    items:updatedItems,
                    ...calculateTotals(updatedItems)
                }
            }else{
              const updatedItems = [...state.items, newItem];
              return{
                items:updatedItems,
                ...calculateTotals(updatedItems)
              }
            }

        }
        case "UPDATE_QUANTITY": {
            const { id, newQuantity } = action.payload;
            if(newQuantity < 1 ){
                return cartReducer(state, {type: "REMOVE_ITEM", payload:{id}});
            } 
            
            const updatedItems = state.items.map(item =>
                
                (item.id === id) ? {
                    ...item,
                    quantity: newQuantity,
                    totalAmount: item.price * newQuantity
                } : item
                
            );
            return {
                items: updatedItems,
                ...calculateTotals(updatedItems)
            }
                
        }
        case "REMOVE_ITEM": {
            const {id} = action.payload;
            const updatedItems = state.items.filter(item => item.id !== id);
            return{
                items:updatedItems,
                ...calculateTotals(updatedItems)
            }
        }
        case "ADD_ADDON": {
            const { parentItemId, addon } = action.payload;
            const updatedItems = state.items.map(item => {
                if (item.id === parentItemId) {
                    const existingAddons = item.addons || [];
                    const existingAddonIndex = existingAddons.findIndex(a => a.id === addon.id);
                    
                    let newAddons: ICartItem[];
                    if (existingAddonIndex > -1) {
                        // Update existing addon quantity
                        newAddons = [...existingAddons];
                        const existingAddon = newAddons[existingAddonIndex];
                        newAddons[existingAddonIndex] = {
                            ...existingAddon,
                            quantity: existingAddon.quantity + addon.quantity,
                            totalAmount: existingAddon.totalAmount + addon.totalAmount
                        };
                    } else {
                        // Add new addon
                        newAddons = [...existingAddons, addon];
                    }
                    
                    return {
                        ...item,
                        addons: newAddons
                    };
                }
                return item;
            });
            
            return {
                items: updatedItems,
                ...calculateTotals(updatedItems)
            };
        }
        case "REMOVE_ADDON": {
            const { parentItemId, addonId } = action.payload;
            const updatedItems = state.items.map(item => {
                if (item.id === parentItemId && item.addons) {
                    return {
                        ...item,
                        addons: item.addons.filter(addon => addon.id !== addonId)
                    };
                }
                return item;
            });
            
            return {
                items: updatedItems,
                ...calculateTotals(updatedItems)
            };
        }
        case "UPDATE_ADDON_QUANTITY": {
            const { parentItemId, addonId, newQuantity } = action.payload;
            if (newQuantity < 1) {
                return cartReducer(state, {type: "REMOVE_ADDON", payload: {parentItemId, addonId}});
            }
            
            const updatedItems = state.items.map(item => {
                if (item.id === parentItemId && item.addons) {
                    return {
                        ...item,
                        addons: item.addons.map(addon =>
                            addon.id === addonId
                                ? {
                                    ...addon,
                                    quantity: newQuantity,
                                    totalAmount: addon.price * newQuantity
                                }
                                : addon
                        )
                    };
                }
                return item;
            });
            
            return {
                items: updatedItems,
                ...calculateTotals(updatedItems)
            };
        }
        case "CLEAR_CART": {
            return initialCartState;
        }
        default: {
            return state;
        }
    }
};