"use client";

import { useState } from "react";
import { TOUR_STORAGE_KEY } from "@/lib/tour";
import { TourTrigger } from "./TourTrigger";
import { OnboardingTour } from "./OnboardingTour";

export function TourController() {
  const [open, setOpen] = useState(false);

  const handleStart = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(TOUR_STORAGE_KEY, "1");
    }
  };

  return (
    <>
      <TourTrigger onStart={handleStart} />
      <OnboardingTour open={open} onClose={handleClose} />
    </>
  );
}
