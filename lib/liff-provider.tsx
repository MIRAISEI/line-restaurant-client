"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { LiffProfile } from "@/types/liff-types";

interface LiffContextType {
    isLiffReady: boolean;
    isInLiff: boolean;
    liffProfile: LiffProfile | null;
    isLiffLoading: boolean;
    liffError: string | null;
    initializeLiff: () => Promise<void>;
}

const LiffContext = createContext<LiffContextType | undefined>(undefined);

export function LiffProvider({ children }: { children: ReactNode }) {
    const [isLiffReady, setIsLiffReady] = useState(false);
    const [isInLiff, setIsInLiff] = useState(false);
    const [liffProfile, setLiffProfile] = useState<LiffProfile | null>(null);
    const [isLiffLoading, setIsLiffLoading] = useState(true);
    const [liffError, setLiffError] = useState<string | null>(null);

    const initializeLiff = async () => {
        // Check if LIFF ID is configured
        const liffId = process.env.NEXT_PUBLIC_LIFF_ID;

        if (!liffId) {
            console.warn("LIFF ID not configured. LIFF features will be disabled.");
            setIsLiffLoading(false);
            return;
        }

        try {
            // Dynamically import LIFF SDK (client-side only)
            const liff = (await import("@line/liff")).default;

            // Initialize LIFF
            await liff.init({ liffId });

            setIsLiffReady(true);
            setIsInLiff(liff.isInClient());

            // If in LIFF and logged in, get profile
            if (liff.isInClient() && liff.isLoggedIn()) {
                try {
                    const profile = await liff.getProfile();
                    setLiffProfile(profile);
                    console.log("LIFF profile loaded:", profile);
                } catch (error) {
                    console.error("Failed to get LIFF profile:", error);
                    setLiffError("Failed to get LINE profile");
                }
            } else if (liff.isInClient() && !liff.isLoggedIn()) {
                // If in LIFF but not logged in, trigger login
                console.log("User not logged in to LINE, triggering login...");
                liff.login();
            }
        } catch (error) {
            console.error("LIFF initialization failed:", error);
            setLiffError(error instanceof Error ? error.message : "LIFF initialization failed");
        } finally {
            setIsLiffLoading(false);
        }
    };

    useEffect(() => {
        // Initialize LIFF when component mounts
        initializeLiff();
    }, []);

    return (
        <LiffContext.Provider
            value={{
                isLiffReady,
                isInLiff,
                liffProfile,
                isLiffLoading,
                liffError,
                initializeLiff,
            }}
        >
            {children}
        </LiffContext.Provider>
    );
}

export function useLiff() {
    const context = useContext(LiffContext);
    if (context === undefined) {
        throw new Error("useLiff must be used within a LiffProvider");
    }
    return context;
}
