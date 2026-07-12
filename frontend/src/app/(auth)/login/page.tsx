"use client";

import { motion } from "framer-motion";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <LoginForm />
    </motion.div>
  );
}
