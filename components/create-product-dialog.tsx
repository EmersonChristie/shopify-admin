"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { ProductFormData } from "@/lib/shopify-gql";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { ImageUpload } from "./image-upload"; // We'll create this next
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const defaultValues: ProductFormData = {
  title: "",
  description: "",
  price: "",
  images: [],
  trackQuantity: true,
  quantity: 1,
  metafields: {
    title_tag: "",
    description_tag: "",
    medium: "Oil on Canvas",
    authentication:
      "This work comes with a certificate of authenticity signed by Emerson.",
    width: "",
    height: "",
    dimensions: "",
    year: "",
  },
};

export function CreateProductDialog() {
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProductFormData>({
    defaultValues: {
      ...defaultValues,
      metafields: {
        ...defaultValues.metafields,
        authentication:
          "This work comes with a certificate of authenticity signed by Emerson.",
      },
    },
  });
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const onSubmit = async (data: ProductFormData, e?: React.FormEvent) => {
    if (e?.type !== "submit") {
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      console.log(
        "Files before submission:",
        data.images.map((file) => ({
          name: file.name,
          type: file.type,
          size: file.size,
          isFile: file instanceof File,
          constructor: file.constructor.name,
        }))
      );

      const validFiles = data.images.filter(
        (file) => file instanceof File && file.name && file.size > 0
      );

      if (validFiles.length !== data.images.length) {
        console.warn("Some files are invalid:", {
          totalFiles: data.images.length,
          validFiles: validFiles.length,
        });
      }

      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("description", data.description);
      formData.append("price", data.price);
      formData.append("trackQuantity", String(data.trackQuantity));
      formData.append("quantity", String(data.quantity));

      Object.entries(data.metafields).forEach(([key, value]) => {
        formData.append(`metafields[${key}]`, value);
      });

      validFiles.forEach((file, index) => {
        formData.append(`images[${index}]`, file);
      });

      const response = await fetch("/api/products/create", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create product");
      }

      const result = await response.json();
      console.log("Product created successfully:", result);

      toast({
        title: "Product Created Successfully",
        description: (
          <div className="mt-2 text-sm">
            <p>Title: {result.data.productCreate.product.title}</p>
            <p>ID: {result.data.productCreate.product.id}</p>
            <p>
              Images: {result.data.productCreate.product.media.nodes.length}
            </p>
          </div>
        ),
        duration: 5000,
      });

      window.dispatchEvent(new CustomEvent("productCreated"));
    } catch (error) {
      console.error("Failed to create product:", error);

      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to create product",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Watch height and width fields
  const height = watch("metafields.height");
  const width = watch("metafields.width");
  const description = watch("description");

  // Update dimensions and description when height or width changes
  useEffect(() => {
    if (height && width) {
      // Update dimensions
      const dimensionsString = `${height} x ${width} in`;
      setValue("metafields.dimensions", dimensionsString);

      // Remove any existing dimensions text from description
      let updatedDescription =
        description?.replace(/\n*Dimensions:.*$/, "") || "";

      // Add new dimensions text
      const dimensionsText = `Dimensions: ${height} x ${width} in`;
      setValue(
        "description",
        updatedDescription
          ? `${updatedDescription}\n\n${dimensionsText}`
          : dimensionsText
      );
    }
  }, [height, width, setValue]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default">Create New Product</Button>
      </DialogTrigger>
      <DialogContent className="max-w-[90vw] w-full max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Create New Product</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit((data) => onSubmit(data, e))(e);
          }}
          className="space-y-6"
        >
          <ScrollArea className="h-[75vh] pr-4">
            <div className="grid grid-cols-2 gap-6">
              {/* Left Column - Main Details */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" {...register("title")} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" {...register("description")} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Price</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    {...register("price")}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="trackQuantity"
                    checked={watch("trackQuantity")}
                    onCheckedChange={(checked: boolean) =>
                      setValue("trackQuantity", checked)
                    }
                  />
                  <Label htmlFor="trackQuantity">Track Quantity</Label>
                </div>

                {watch("trackQuantity") && (
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      {...register("quantity")}
                    />
                  </div>
                )}

                <ImageUpload
                  onImagesChange={(files) => {
                    // Only update the form's images when explicitly adding or removing images
                    setValue("images", files);
                  }}
                  isUploading={isUploading}
                  error={uploadError ?? undefined}
                  width={watch("metafields.width")}
                  height={watch("metafields.height")}
                  onGeneratedImagesChange={(generatedFiles) => {
                    // Handle generated images separately from form submission
                    setValue("images", [...watch("images"), ...generatedFiles]);
                  }}
                />
              </div>

              {/* Right Column - Metafields */}
              <div className="space-y-4">
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title_tag">SEO Title</Label>
                      <Input
                        id="title_tag"
                        {...register("metafields.title_tag")}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description_tag">SEO Description</Label>
                      <Textarea
                        id="description_tag"
                        {...register("metafields.description_tag")}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="medium">Medium</Label>
                      <Input
                        id="medium"
                        {...register("metafields.medium")}
                        readOnly
                        className="bg-muted"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="authentication">Authentication</Label>
                      <Textarea
                        id="authentication"
                        {...register("metafields.authentication")}
                        readOnly
                        className="bg-muted"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dimensions">Dimensions</Label>
                      <Input
                        id="dimensions"
                        {...register("metafields.dimensions")}
                        readOnly
                        className="bg-muted"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="width">Width (inches)</Label>
                        <Input
                          id="width"
                          type="number"
                          step="0.1"
                          {...register("metafields.width")}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="height">Height (inches)</Label>
                        <Input
                          id="height"
                          type="number"
                          step="0.1"
                          {...register("metafields.height")}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="year">Year</Label>
                      <Input id="year" {...register("metafields.year")} />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </ScrollArea>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isUploading}>
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Product...
                </>
              ) : (
                "Create Product"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
