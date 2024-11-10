"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { GripVertical, X, Loader2, LayoutGrid, LayoutList } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GenerateImagesButton } from "./generate-images-button";
import { useForm } from "react-hook-form";
import { ImagePreviewModal } from "./image-preview-modal";

interface ImageUploadProps {
  onImagesChange: (files: File[]) => void;
  onGeneratedImagesChange: (files: File[]) => void;
  isUploading?: boolean;
  error?: string;
  width?: string;
  height?: string;
}

interface SortableImageItemProps {
  id: string;
  preview: string;
  file: File;
  onRemove: () => void;
  disabled: boolean;
  isGridView: boolean;
  onClick?: () => void;
}

function SortableImageItem({
  id,
  preview,
  file,
  onRemove,
  disabled,
  isGridView,
  index,
  onClick,
}: SortableImageItemProps & { index: number }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const orderBadge = (
    <div className="absolute top-2 left-2 bg-black/75 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium">
      {index + 1}
    </div>
  );

  if (isGridView) {
    return (
      <Card
        ref={setNodeRef}
        style={style}
        className={`relative group aspect-square ${
          isDragging ? "ring-2 ring-primary" : ""
        }`}
      >
        {orderBadge}
        <div
          className="cursor-grab active:cursor-grabbing disabled:cursor-not-allowed absolute top-2 left-10 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-5 w-5 text-white drop-shadow-md" />
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          disabled={disabled}
          className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X className="h-4 w-4" />
        </Button>
        <div className="w-full h-full p-4 flex items-center justify-center">
          <img
            src={preview}
            alt={`Preview ${file.name}`}
            className="max-w-full max-h-full object-contain cursor-pointer"
            onClick={onClick}
          />
        </div>
        <div className="p-2 bg-white/90 absolute bottom-0 left-0 right-0">
          <p className="text-sm font-medium truncate">{file.name}</p>
          <p className="text-xs text-gray-500">
            {(file.size / 1024 / 1024).toFixed(2)} MB
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`p-2 ${isDragging ? "ring-2 ring-primary" : ""}`}
    >
      <div className="flex items-center space-x-2">
        <div className="relative">
          {orderBadge}
          <button
            type="button"
            className="cursor-grab active:cursor-grabbing disabled:cursor-not-allowed ml-8"
            {...attributes}
            {...listeners}
            disabled={disabled}
          >
            <GripVertical className="h-5 w-5 text-gray-400" />
          </button>
        </div>
        <img
          src={preview}
          alt={`Preview ${file.name}`}
          className="h-20 w-20 object-cover rounded cursor-pointer"
          onClick={onClick}
        />
        <div className="flex-1 ml-2">
          <p className="text-sm font-medium">{file.name}</p>
          <p className="text-sm text-gray-500">
            {(file.size / 1024 / 1024).toFixed(2)} MB
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          disabled={disabled}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}

export function ImageUpload({
  onImagesChange,
  onGeneratedImagesChange,
  isUploading = false,
  error,
  width,
  height,
}: ImageUploadProps) {
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isGridView, setIsGridView] = useState(true);
  const { watch } = useForm();
  const [previewImage, setPreviewImage] = useState<{
    index: number;
    open: boolean;
  }>({ index: 0, open: false });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = previews.findIndex((preview) => preview === active.id);
      const newIndex = previews.findIndex((preview) => preview === over.id);

      setPreviews(arrayMove(previews, oldIndex, newIndex));
      setImages((prevImages) => {
        const newImages = arrayMove(prevImages, oldIndex, newIndex);
        onImagesChange(newImages);
        return newImages;
      });
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);

      // Validate file sizes (max 20MB each)
      const invalidFiles = newFiles.filter(
        (file) => file.size > 20 * 1024 * 1024
      );
      if (invalidFiles.length > 0) {
        alert("Some files are too large. Maximum size is 20MB per image.");
        return;
      }

      // Validate file types
      const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
      const invalidTypes = newFiles.filter(
        (file) => !validTypes.includes(file.type)
      );
      if (invalidTypes.length > 0) {
        alert(
          "Invalid file type. Please upload only JPEG, PNG, GIF, or WebP images."
        );
        return;
      }

      const newPreviews = newFiles.map((file) => URL.createObjectURL(file));

      setImages((prev) => {
        const updated = [...prev, ...newFiles];
        onImagesChange(updated);
        return updated;
      });

      setPreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      onImagesChange(updated);
      return updated;
    });

    setPreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label htmlFor="images">Product Images</Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setIsGridView(!isGridView)}
        >
          {isGridView ? (
            <LayoutList className="h-4 w-4" />
          ) : (
            <LayoutGrid className="h-4 w-4" />
          )}
        </Button>
      </div>

      <input
        id="images"
        type="file"
        multiple
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleFileChange}
        className="hidden"
        disabled={isUploading}
      />
      <Button
        type="button"
        variant="outline"
        onClick={() => document.getElementById("images")?.click()}
        className="w-full"
        disabled={isUploading}
      >
        {isUploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Uploading...
          </>
        ) : (
          "Upload Images"
        )}
      </Button>

      <GenerateImagesButton
        title={images[0]?.name || ""}
        width={width || ""}
        height={height || ""}
        currentImage={images[0]}
        onImagesGenerated={(generatedImages) => {
          // Reorder the images:
          // 1. Store the original image
          const originalImage = images[0];
          const originalPreview = previews[0];

          // 2. Create new arrays with the generated images first, then the original
          const reorderedImages = [...generatedImages, originalImage];
          const newPreviews = [
            ...generatedImages.map((file) => URL.createObjectURL(file)),
            originalPreview,
          ];

          // 3. Update the state and notify parent
          setImages(reorderedImages);
          setPreviews(newPreviews);
          onImagesChange(reorderedImages);
        }}
        disabled={isUploading || images.length === 0}
      />

      {error && <div className="text-sm text-red-500 mt-2">{error}</div>}

      {isUploading && (
        <div className="space-y-2">
          <Progress value={uploadProgress} className="w-full" />
          <p className="text-sm text-gray-500 text-center">
            Uploading... {uploadProgress}%
          </p>
        </div>
      )}

      {previews.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={previews}
            strategy={
              isGridView ? rectSortingStrategy : verticalListSortingStrategy
            }
          >
            <div
              className={
                isGridView
                  ? "grid grid-cols-2 md:grid-cols-3 gap-4"
                  : "space-y-2"
              }
            >
              {previews.map((preview, index) => (
                <SortableImageItem
                  key={preview}
                  id={preview}
                  preview={preview}
                  file={images[index]}
                  onRemove={() => removeImage(index)}
                  disabled={isUploading}
                  isGridView={isGridView}
                  index={index}
                  onClick={() => setPreviewImage({ index, open: true })}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <ImagePreviewModal
        images={previews.map((preview, i) => ({
          url: preview,
          title: images[i]?.name || `Image ${i + 1}`,
        }))}
        initialIndex={previewImage.index}
        open={previewImage.open}
        onOpenChange={(open) => setPreviewImage((prev) => ({ ...prev, open }))}
      />
    </div>
  );
}
