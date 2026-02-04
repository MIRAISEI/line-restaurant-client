import { IMenuItem } from "@/types/menu-types";

export const MockData:IMenuItem[] = [
    {
        id: "d001",
        title: "Kaiseki Ryori",
        price: 125,
        description: "A meticulously prepared multi-course Japanese dinner...",
        image: "/kottu.jpg", 
        isAvailable:true,
        category: "Main Course",
    },
    {
        id: "d002",
        title: "Sushi Platter",
        price: 95,
        description: "Chef's selection of the finest seasonal fish...",
        image: "/sushi.jpg",
        isAvailable:true,
        category: "Main Course",
    },
] 