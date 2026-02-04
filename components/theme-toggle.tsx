"use client";

import { useTheme } from "next-themes";
import { FaMoon, FaSun } from "react-icons/fa";

export function ThemeToggle(){
    const {theme, setTheme} = useTheme();
    return(
        <div className="flex h-[30px] rounded-full mr-3 mt-[-12px] md:mr-6">
            <button
            onClick={()=> setTheme(theme === "light" ? "dark" : "light")}
            >
            <FaSun className="absolute h-4 w-4 rotate-0 scale-100 dark:-rotate-90 dark:scale-0"></FaSun>
            <FaMoon className="absolute h-4 w-4 rotate-90 scale-0 dark:-rotate-0 dark:scale-100"></FaMoon>
            </button>
        </div>
        
    )
}