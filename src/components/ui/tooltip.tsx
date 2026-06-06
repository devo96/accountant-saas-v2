"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ReactNode, useState } from "react";
import { cn } from "@/lib/utils";

type TooltipProps = {
  content: string;
  side?: "top" | "bottom" | "left" | "right";
  children: ReactNode;
};

export function Tooltip({ content, side = "top", children }: TooltipProps) {
  const [show, setShow] = useState(false);
  const positions: Record<string, string> = {
    top: "bottom-full start-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full start-1/2 -translate-x-1/2 mt-2",
    left: "end-full top-1/2 -translate-y-1/2 me-2",
    right: "start-full top-1/2 -translate-y-1/2 ms-2",
  };

  return (
    <div className="relative inline-block" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: side === "top" ? 2 : -2 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: side === "top" ? 2 : -2 }}
            className={cn(
              "absolute z-50 whitespace-nowrap rounded-lg bg-gray-900 px-2.5 py-1.5 text-xs text-white shadow-lg dark:bg-gray-700",
              positions[side]
            )}
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
