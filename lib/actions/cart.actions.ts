"use server"

import prisma from "@/lib/prisma"
import { ICartItem } from "@/types/cart-types"


export async function getCart(userId: string): Promise<ICartItem[] | null> {
    try {
        const cart = await prisma.cart.findUnique({
            where: { userId },
            include: {
                items: {
                    include: {
                        menuItem: true
                    }
                },
            },
        })

        if (!cart) return null

        return cart.items.map((item: any): ICartItem => ({
            cartItemId: item.id,
            id: item.menuItemId,
            title: item.menuItem.nameEn,
            price: item.price,
            totalAmount: item.totalAmount,
            quantity: item.quantity,
            image: item.menuItem.imageUrl,
            description: "",
            isAvailable: item.menuItem.isActive,
            category: item.menuItem.category,
            addons: item.addons ? (item.addons as unknown as ICartItem[]) : undefined,
        }))
    } catch (error) {
        console.error("Failed to fetch cart:", error)
        return null
    }
}


export async function syncCart(userId: string, items: ICartItem[]) {
    try {

        const cart = await prisma.cart.upsert({
            where: { userId },
            update: {},
            create: { userId },
        })

        await prisma.cartItem.deleteMany({
            where: { cartId: cart.id },
        })

        if (items.length > 0) {

            await prisma.cartItem.createMany({
                data: items.map((item) => ({
                    cartId: cart.id,
                    menuItemId: item.id,
                    quantity: item.quantity,
                    price: item.price,
                    totalAmount: item.totalAmount,
                    addons: item.addons ? JSON.parse(JSON.stringify(item.addons)) : undefined,
                })),
            })
        }

        return { success: true }
    } catch (error) {
        console.error("Failed to sync cart:", error)
        return { success: false, error: "Failed to sync cart" }
    }
}


export async function clearCart(userId: string) {
    try {
        const cart = await prisma.cart.findUnique({
            where: { userId },
        })

        if (cart) {
            await prisma.cartItem.deleteMany({
                where: { cartId: cart.id },
            })
        }
        return { success: true }
    } catch (error) {
        console.error("Failed to clear cart:", error)
        return { success: false, error: "Failed to clear cart" }
    }
}
