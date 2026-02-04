export interface IMenuItem {
    id:string;
    title:string;
    price:number;
    description:string;
    image:string;
    isAvailable:boolean;
    category:string;
    subcategory?:string | null;
    isAddon?:boolean;
}
