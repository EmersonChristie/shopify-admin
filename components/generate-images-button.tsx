"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { generateProductImages } from "@/lib/image-scripts/generateImages";
import { ImageGenerationOptions } from "@/lib/image-scripts/types";

interface GenerateImagesButtonProps {
  title: string;
  width: string;
  height: string;
  currentImage?: File;
  onImagesGenerated: (images: File[]) => void;
  disabled?: boolean;
}

export function GenerateImagesButton({
  title,
  width,
  height,
  currentImage,
  onImagesGenerated,
  disabled,
}: GenerateImagesButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  const { register, getValues } = useForm<ImageGenerationOptions>({
    defaultValues: {
      canvasWidth: 2048,
      canvasHeight: 2048,
      wallHeightInches: 114,
    },
  });

  const canGenerate = Boolean(title && width && height && currentImage);

  const handleGenerate = async () => {
    if (!canGenerate || !currentImage) return;

    setIsGenerating(true);
    try {
      const formValues = getValues();
      const images = await generateProductImages(
        {
          imageSrc: currentImage,
          id: "temp-id",
          title,
          artworkHeightInches: parseFloat(height),
          artworkWidthInches: parseFloat(width),
        },
        formValues
      );

      onImagesGenerated(images.map((img) => img.file));
      setIsConfigOpen(false);
    } catch (error) {
      console.error("Failed to generate images:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="secondary"
          disabled={disabled || !canGenerate || isGenerating}
          className="w-full mt-4"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Images...
            </>
          ) : (
            "Generate Product Images"
          )}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Image Generation Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Canvas Size</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="canvasWidth">Width</Label>
                <Input
                  id="canvasWidth"
                  type="number"
                  {...register("canvasWidth")}
                />
              </div>
              <div>
                <Label htmlFor="canvasHeight">Height</Label>
                <Input
                  id="canvasHeight"
                  type="number"
                  {...register("canvasHeight")}
                />
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="wallHeightInches">Wall Height (inches)</Label>
            <Input
              id="wallHeightInches"
              type="number"
              step="0.1"
              {...register("wallHeightInches")}
            />
          </div>

          <Button
            type="button"
            disabled={isGenerating}
            onClick={() => handleGenerate()}
          >
            {isGenerating ? "Generating..." : "Generate"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
