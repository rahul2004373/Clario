import { Prisma } from "@prisma/client";

export const formatError = (error: any): string => {
  if (error instanceof Prisma.PrismaClientValidationError) {
    const lines = error.message.split("\n");
    const lastLine = lines[lines.length - 1]?.trim() || lines[lines.length - 2]?.trim();
    if (lastLine && lastLine.startsWith("Invalid value for argument")) {
      return lastLine;
    }
    if (lastLine && lastLine.startsWith("Argument") && lastLine.includes("is missing")) {
      return lastLine;
    }
    return "Invalid data provided. Please check your inputs and try again.";
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      const target = (error.meta?.target as string[])?.join(", ") || "field";
      return `A record with this ${target} already exists.`;
    }
    if (error.code === "P2025") {
      return "The requested record was not found.";
    }
  }

  return error.message || "An unexpected error occurred.";
};
