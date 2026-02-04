export interface UIState {
    isCartDrawerOpen:boolean;
}

export interface UIContextType extends UIState {
    setIsCartDrawerOpen:(isOpen:boolean) => void;
}