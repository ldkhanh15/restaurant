"use client";

import { CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { containerVariants, itemVariants } from "@/lib/motion-variants";

interface Step {
  id: number;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface ProgressStepperProps {
  steps: Step[];
  currentStep: number;
}

export default function ProgressStepper({
  steps,
  currentStep,
}: ProgressStepperProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full py-6 px-4 bg-card/95 backdrop-blur-sm border-b border-border/50 sticky top-0 z-40 shadow-sm"
    >
      <div className="max-w-5xl mx-auto">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex items-center justify-between relative"
        >
          {/* Connection Lines */}
          <div className="absolute top-6 left-0 right-0 h-0.5 bg-border -z-0">
            <motion.div
              className="h-full bg-gradient-to-r from-accent/50 to-accent transition-all duration-500"
              initial={{ width: 0 }}
              animate={{
                width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
              }}
              transition={{
                duration: 0.6,
                ease: [0.22, 1, 0.36, 1],
              }}
            />
          </div>

          {/* Steps */}
          {steps.map((step, index) => {
            const isCompleted = index + 1 < currentStep;
            const isCurrent = index + 1 === currentStep;
            const IconComponent = step.icon;

            return (
              <motion.div
                key={step.id}
                variants={itemVariants}
                className="flex flex-col items-center relative z-10 bg-card rounded-lg px-2"
                whileHover={{ scale: 1.1 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <motion.div
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 relative overflow-hidden",
                    isCompleted
                      ? "bg-gradient-gold border-accent text-primary-foreground shadow-lg"
                      : isCurrent
                      ? "bg-primary border-primary text-primary-foreground shadow-xl"
                      : "bg-background border-border text-muted-foreground"
                  )}
                  initial={{ scale: 0.8, rotate: -180 }}
                  animate={{
                    scale: isCurrent ? 1.15 : isCompleted ? 1.05 : 1,
                    rotate: 0,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 20,
                    delay: index * 0.1,
                  }}
                  whileHover={{
                    scale: isCurrent ? 1.2 : 1.1,
                    rotate: 360,
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isCompleted ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 15,
                      }}
                    >
                      <CheckCircle className="h-6 w-6" />
                    </motion.div>
                  ) : (
                    <IconComponent className="h-5 w-5" />
                  )}
                  {isCurrent && (
                    <motion.div
                      className="absolute inset-0 rounded-full bg-accent/20"
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.5, 0, 0.5],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                  )}
                </motion.div>
                <motion.div
                  className="mt-2 text-center max-w-[120px]"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 + 0.2 }}
                >
                  <p
                    className={cn(
                      "text-xs font-medium transition-colors duration-300",
                      isCurrent
                        ? "text-primary font-bold"
                        : isCompleted
                        ? "text-accent"
                        : "text-muted-foreground"
                    )}
                  >
                    {step.name}
                  </p>
                </motion.div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </motion.div>
  );
}
