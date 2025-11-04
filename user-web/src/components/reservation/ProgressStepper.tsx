"use client";

import { CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

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
    <div className="w-full py-6 px-4 bg-card border-b border-border/50 sticky top-0 z-40">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between relative">
          {/* Connection Lines */}
          <div className="absolute top-6 left-0 right-0 h-0.5 bg-border -z-0">
            <motion.div
              className="h-full bg-gradient-to-r from-accent/50 to-accent transition-all duration-500"
              initial={{ width: 0 }}
              animate={{
                width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
              }}
              transition={{ duration: 0.5 }}
            />
          </div>

          {/* Steps */}
          {steps.map((step, index) => {
            const isCompleted = index + 1 < currentStep;
            const isCurrent = index + 1 === currentStep;
            const IconComponent = step.icon;

            return (
              <div
                key={step.id}
                className="flex flex-col items-center relative z-10 bg-card"
              >
                <motion.div
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                    isCompleted
                      ? "bg-accent border-accent text-primary-foreground"
                      : isCurrent
                      ? "bg-primary border-primary text-primary-foreground shadow-lg scale-110"
                      : "bg-background border-border text-muted-foreground"
                  )}
                  initial={{ scale: 1 }}
                  animate={{ scale: isCurrent ? 1.1 : 1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  {isCompleted ? (
                    <CheckCircle className="h-6 w-6" />
                  ) : (
                    <IconComponent className="h-5 w-5" />
                  )}
                </motion.div>
                <div className="mt-2 text-center max-w-[120px]">
                  <p
                    className={cn(
                      "text-xs font-medium transition-colors",
                      isCurrent
                        ? "text-primary"
                        : isCompleted
                        ? "text-accent"
                        : "text-muted-foreground"
                    )}
                  >
                    {step.name}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
