import React, { useEffect, useRef, useState } from "react";
import Button from "@/components/tiptap-editor/components/ui/button";
import MediaGallery from "./media-gallery";
import "./style.scss";

interface MediaLibraryProps {
  onInsert?: (image: ImageData) => void;
  onClose?: () => void;
}

interface ImageData {
  id?: string;
  url: string;
  created_at?: string;
  bytes?: number;
  format: string;
  display_name: string;
  width: number;
  height: number;
}

const MediaLibrary: React.FC<MediaLibraryProps> = ({ onInsert, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState<ImageData[]>([]);
  const [previews, setPreviews] = useState<ImageData[]>([]);
  const [selected, setSelected] = useState<ImageData | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    const confirmUpload = window.confirm(
      "Please avoid uploading too many images unnecessarily to save storage space. Also, ensure your images comply with copyright rules. Do you wish to continue?"
    );

    if (confirmUpload) {
      fileInput.current?.click();
    }
  };

  const loadImage = (file: File): Promise<ImageData> => {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      const image = new Image();
      image.onload = () => {
        resolve({
          url,
          width: image.width,
          height: image.height,
          format: file.type.split("/")[1] || "unknown",
          display_name: file.name.replace(/\.\w+$/, ""),
        });
      };
      image.src = url;
    });
  };

  const uploadImage = async (file: File): Promise<ImageData | null> => {
    if (!file.type.startsWith("image/")) return null;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/images", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to upload image");

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Upload error:", error);
      return null;
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    // Generate previews
    const previewPromises = Array.from(files).map(loadImage);
    const loadedPreviews = await Promise.all(previewPromises);
    setPreviews(loadedPreviews);

    // Upload files
    const uploadPromises = Array.from(files).map(uploadImage);
    const uploadedResults = await Promise.all(uploadPromises);

    // Clean up temporary URLs
    loadedPreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
    setPreviews([]);

    // Filter out failed uploads (null)
    const validUploads = uploadedResults.filter(
      (img): img is ImageData => img !== null && typeof img === "object"
    );

    // Update safely
    setImages((prev) => [...validUploads, ...(Array.isArray(prev) ? prev : [])]);
    setUploading(false);
  };

  const handleFinish = () => {
    if (selected) onInsert?.(selected);
  };

  useEffect(() => {
    const fetchImages = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/images");
        const data = await response.json();
        if (Array.isArray(data)) {
          setImages(data);
        } else {
          console.warn("Unexpected response for /api/images:", data);
          setImages([]);
        }
      } catch (error) {
        console.error("Error fetching images:", error);
        setImages([]);
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, []);

  return (
    <div className="media-library">
      <header className="media-library__header">
        <h2>Assets</h2>
        <Button disabled={loading || uploading} onClick={handleUploadClick}>
          Upload
        </Button>
      </header>

      <div className="media-library__content">
        {loading ? (
          <div className="media-library__spinner" aria-label="Loading images" />
        ) : (
          <MediaGallery
            data={[...(Array.isArray(previews) ? previews : []), ...(Array.isArray(images) ? images : [])]}
            onSelect={setSelected}
            selected={selected}
          />
        )}
      </div>

      <footer className="media-library__footer">
        <Button
          variant="outline"
          className="media-library__btn media-library__btn--cancel"
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button
          className="media-library__btn media-library__btn--finish"
          disabled={!selected || loading || uploading}
          onClick={handleFinish}
        >
          Insert
        </Button>
      </footer>

      <input
        style={{ display: "none" }}
        type="file"
        multiple
        accept="image/*"
        ref={fileInput}
        onChange={handleFileChange}
      />
    </div>
  );
};

export default MediaLibrary;
