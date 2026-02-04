"use client";

import { useAuth } from "@/lib/auth-context";
import { useState } from "react";

export default function LineIdMessage() {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(true);

  // Only show for customers with LINE ID
  if (!user || user.role !== "customer" || !user.lineUserId) {
    return null;
  }

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed top-24 right-4 z-50 bg-gradient-to-r from-[#06C755] to-[#00C300] text-white rounded-lg shadow-lg border-2 border-white/50 p-3 max-w-xs animate-in slide-in-from-top-5 duration-300">
      <div className="flex items-start gap-2">
        <div className="flex-shrink-0">
          <svg
            className="w-5 h-5"
            fill="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 5.187 19.514.699 14.396.699c-5.12 0-9.601 4.488-9.601 9.615 0 5.187 4.481 9.615 9.601 9.615 1.406 0 2.721-.312 3.917-.811l4.301 1.876c.174.075.36.111.526.111.529 0 .954-.436.954-.983 0-.312-.135-.585-.36-.749l-4.266-1.849c1.069-1.001 1.721-2.426 1.721-3.998 0-.018-.014-.018-.014-.018zm-9.604 7.995c-4.416 0-7.98-3.6-7.98-8.029 0-4.428 3.564-8.028 7.98-8.028 4.417 0 7.98 3.6 7.98 8.028 0 1.521-.555 2.907-1.476 3.982l-.345-.149c-.36-.161-.776-.129-1.069.09l-3.214 1.401c-.045.021-.045.021-.09.021-.045 0-.09 0-.09-.021l-3.184-1.401c-.36-.18-.776-.18-1.069-.09l-.36.149c-1.006-1.075-1.476-2.461-1.476-3.982 0-1.406.555-2.791 1.476-3.981l.36.149c.36.18.776.18 1.069.09l3.214-1.401c.045-.021.045-.021.09-.021.045 0 .09 0 .09.021l3.184 1.401c.36.18.776.18 1.069.09l.345-.149c.921 1.19 1.476 2.575 1.476 3.981 0 4.429-3.563 8.029-7.98 8.029z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold mb-1">LINE ID</div>
          <div className="text-sm font-mono break-all">{user.lineUserId}</div>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="flex-shrink-0 text-white/80 hover:text-white transition-colors"
          aria-label="Close"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

