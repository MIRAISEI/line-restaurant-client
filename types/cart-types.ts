import { IMenuItem } from "./menu-types";

export interface ICartItem extends IMenuItem {
    quantity:number;
    totalAmount:number;
    addons?: ICartItem[]; // Addons associated with this item
}

export interface CartState{
    items:ICartItem[];
    totalCartAmount:number;
}

export type CartAction = 
| {type: "ADD_ITEM"; payload: ICartItem}
| {type: "REMOVE_ITEM", payload:{id: string}}
| {type: "UPDATE_QUANTITY", payload: {id: string, newQuantity: number}}
| {type: "ADD_ADDON", payload: {parentItemId: string, addon: ICartItem}}
| {type: "REMOVE_ADDON", payload: {parentItemId: string, addonId: string}}
| {type: "UPDATE_ADDON_QUANTITY", payload: {parentItemId: string, addonId: string, newQuantity: number}}
| {type: "CLEAR_CART"};


export interface CartContextType extends CartState {
    dispatch : React.Dispatch<CartAction>;
}