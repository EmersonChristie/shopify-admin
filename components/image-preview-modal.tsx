"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "./ui/button";
import { useState, useEffect } from "react";

interface ImagePreviewModalProps {
  images: { url: string; title: string }[];
  initialIndex?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImagePreviewModal({
  images,
  initialIndex = 0,
  open,
  onOpenChange,
}: ImagePreviewModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") handlePrevious();
    if (e.key === "ArrowRight") handleNext();
    if (e.key === "Escape") onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[90vw] max-h-[90vh] flex flex-col p-0"
        onKeyDown={handleKeyDown}
      >
        <DialogHeader className="p-4 flex-shrink-0">
          <DialogTitle className="text-center pr-8">
            {images[currentIndex]?.title || "Image Preview"}
            <span className="text-muted-foreground ml-2">
              {currentIndex + 1} of {images.length}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="relative flex-1 flex items-center justify-center bg-black/5 dark:bg-white/5 overflow-auto p-4">
          <img
            src={images[currentIndex]?.url}
            alt={images[currentIndex]?.title}
            className="max-h-[calc(90vh-8rem)] w-auto object-contain"
          />

          {images.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 h-8 w-8 rounded-full bg-white/10 hover:bg-white/20"
                onClick={handlePrevious}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 h-8 w-8 rounded-full bg-white/10 hover:bg-white/20"
                onClick={handleNext}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
