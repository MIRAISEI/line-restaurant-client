"use server"

import prisma from "@/lib/prisma"
import { ICartItem } from "@/types/cart-types"

type CartRecord = {
  id: string
  items: Array<{
    id: string
    menuItemId: string
    price: number
    totalAmount: number
    quantity: number
    addons?: unknown
    menuItem: {
      nameEn: string
      imageUrl: string
      isActive: boolean
      category: string
    }
  }>
}

type CartDelegate = {
  findUnique: (args: {
    where: { userId: string }
    include?: { items?: { include?: { menuItem?: boolean } } }
  }) => Promise<CartRecord | null>
  upsert: (args: {
    where: { userId: string }
    update: Record<string, never>
    create: { userId: string }
  }) => Promise<{ id: string }>
}

type CartItemDelegate = {
  deleteMany: (args: { where: { cartId: string } }) => Promise<unknown>
  createMany: (args: {
    data: Array<{
      cartId: string
      menuItemId: string
      quantity: number
      price: number
      totalAmount: number
      addons?: unknown
    }>
  }) => Promise<unknown>
}

function getCartDelegates(): { cart?: CartDelegate; cartItem?: CartItemDelegate } {
  return prisma as unknown as { cart?: CartDelegate; cartItem?: CartItemDelegate }
}

export async function getCart(userId: string): Promise<ICartItem[] | null> {
  try {
    const { cart: cartDelegate } = getCartDelegates()
    if (!cartDelegate) return null

    const cart = await cartDelegate.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            menuItem: true
          }
        }
      }
    })

    if (!cart) return null

    return cart.items.map((item): ICartItem => ({
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
      addons: item.addons ? (item.addons as ICartItem[]) : undefined
    }))
  } catch (error) {
    console.error("Failed to fetch cart:", error)
    return null
  }
}

export async function syncCart(userId: string, items: ICartItem[]) {
  try {
    const { cart: cartDelegate, cartItem: cartItemDelegate } = getCartDelegates()
    if (!cartDelegate || !cartItemDelegate) {
      return { success: true }
    }

    const cart = await cartDelegate.upsert({
      where: { userId },
      update: {},
      create: { userId }
    })

    await cartItemDelegate.deleteMany({
      where: { cartId: cart.id }
    })

    if (items.length > 0) {
      await cartItemDelegate.createMany({
        data: items.map((item) => ({
          cartId: cart.id,
          menuItemId: item.id,
          quantity: item.quantity,
          price: item.price,
          totalAmount: item.totalAmount,
          addons: item.addons ? JSON.parse(JSON.stringify(item.addons)) : undefined
        }))
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
    const { cart: cartDelegate, cartItem: cartItemDelegate } = getCartDelegates()
    if (!cartDelegate || !cartItemDelegate) {
      return { success: true }
    }

    const cart = await cartDelegate.findUnique({
      where: { userId }
    })

    if (cart) {
      await cartItemDelegate.deleteMany({
        where: { cartId: cart.id }
      })
    }

    return { success: true }
  } catch (error) {
    console.error("Failed to clear cart:", error)
    return { success: false, error: "Failed to clear cart" }
  }
}
