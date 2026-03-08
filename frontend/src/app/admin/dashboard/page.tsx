"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";

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

export default function AdminDashboardPage() {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      <motion.div
        variants={item}
        className="flex flex-col items-center gap-6 py-4"
      >
        <Image
          src="/mariveles-seal.png"
          alt="Mariveles Seal"
          width={120}
          height={120}
          className="drop-shadow-lg"
          priority
        />
        <div className="text-center">
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground">
            Admin Dashboard
          </h1>
        </div>
      </motion.div>
    </motion.div>
  );
}
