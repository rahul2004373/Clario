"use client";

import { motion } from "framer-motion";
import { SignupForm } from "@/components/auth/SignupForm";

export default function SignupPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <SignupForm />
    </motion.div>
  );
}
