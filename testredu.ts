import { CartState, CartAction, ICartItem as CartItem } from '@/types/cart-types';

// Helper function to calculate the total amount of the entire cart
const calculateTotals = (items: CartItem[]): { totalCartAmount: number } => {
    const totalCartAmount = items.reduce((total, item) => total + item.totalAmount, 0);
    return { totalCartAmount };
};

// Initial state for the cart
export const initialCartState: CartState = {
    items: [],
    totalCartAmount: 0,
};

export const cartReducer = (state: CartState, action: CartAction): CartState => {
    switch (action.type) {
        case 'ADD_ITEM': {
            const newItem = action.payload;
            const existingItemIndex = state.items.findIndex(item => item.id === newItem.id);

            if (existingItemIndex > -1) {
                // Item exists: Update quantity and total amount
                const updatedItems = [...state.items];
                const existingItem = updatedItems[existingItemIndex];
                
                const updatedItem: CartItem = {
                    ...existingItem,
                    // Increment existing quantity by the quantity being added
                    quantity: existingItem.quantity + newItem.quantity,
                    // Increment existing total by the total amount being added
                    totalAmount: existingItem.totalAmount + newItem.totalAmount
                };
                updatedItems[existingItemIndex] = updatedItem;
                
                return {
                    items: updatedItems,
                    ...calculateTotals(updatedItems)
                };
            } else {
                // New item: Add it to the array
                const updatedItems = [...state.items, newItem];
                return {
                    items: updatedItems,
                    ...calculateTotals(updatedItems)
                };
            }
        }

        case 'UPDATE_QUANTITY': {
            const { id, newQuantity } = action.payload;
            
            // If new quantity is zero or less, remove the item
            if (newQuantity <= 0) {
                return cartReducer(state, { type: 'REMOVE_ITEM', payload: { id } });
            }

            const updatedItems = state.items.map(item =>
                item.id === id
                    ? {
                        ...item,
                        quantity: newQuantity,
                        totalAmount: item.price * newQuantity
                      }
                    : item
            );

            return {
                items: updatedItems,
                ...calculateTotals(updatedItems)
            };
        }

        case 'REMOVE_ITEM': {
            const updatedItems = state.items.filter(item => item.id !== action.payload.id);
            return {
                items: updatedItems,
                ...calculateTotals(updatedItems)
            };
        }

        case 'CLEAR_CART': {
            return initialCartState;
        }
        
        default:
            return state;
    }
};