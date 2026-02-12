import { IMenuItem } from "./menu-types";

export interface ICartItem extends IMenuItem {
    cartItemId: string; // Unique identifier for this cart entry
    quantity: number;
    totalAmount: number;
    addons?: ICartItem[]; // Addons associated with this item
}

export interface CartState {
    items: ICartItem[];
    totalCartAmount: number;
}

export type CartAction =
    | { type: "ADD_ITEM"; payload: ICartItem }
    | { type: "REMOVE_ITEM", payload: { cartItemId: string } }
    | { type: "UPDATE_QUANTITY", payload: { cartItemId: string, newQuantity: number } }
    | { type: "ADD_ADDON", payload: { cartItemId: string, addon: ICartItem } }
    | { type: "REMOVE_ADDON", payload: { cartItemId: string, addonId: string } }
    | { type: "UPDATE_ADDON_QUANTITY", payload: { cartItemId: string, addonId: string, newQuantity: number } }
    | { type: "SET_ITEMS", payload: ICartItem[] }
    | { type: "CLEAR_CART" };


export interface CartContextType extends CartState {
    dispatch: React.Dispatch<CartAction>;
}