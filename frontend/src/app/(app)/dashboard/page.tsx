/* ================================================================
   STUDENT DASHBOARD
   Personalized welcome with seal and program name
   ================================================================ */

"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";

/* -- Stagger animation helpers -- */
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 15 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
};

/* ======================== DASHBOARD PAGE ======================== */

export default function DashboardPage() {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="flex items-center justify-center min-h-[60vh] w-full"
    >
      <motion.div variants={item} className="flex flex-col items-center gap-6">
        <Image
          src="/mariveles-seal.png"
          alt="Mariveles Seal"
          width={180}
          height={180}
          className="drop-shadow-lg"
          priority
        />
        <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground text-center">
          Iskolar ng Mariveles
        </h1>
      </motion.div>
    </motion.div>
  );
}
