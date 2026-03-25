"use client";

import React, { useState, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, X, Grid, LayoutGrid, Rows, Columns } from "lucide-react";
import { uploadImage } from "@/lib/supabase/storage";

interface PhotoGridModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (images: string[], layout: GridLayout) => void;
}

export type GridLayout = "auto" | "2-col" | "3-col" | "1-2" | "2-1" | "masonry";

const layoutOptions: { id: GridLayout; label: string; icon: React.ReactNode; description: string }[] = [
  { id: "auto", label: "자동", icon: <LayoutGrid className="w-5 h-5" />, description: "이미지 수에 따라 자동 배열" },
  { id: "2-col", label: "2열", icon: <Columns className="w-5 h-5" />, description: "2개씩 나란히" },
  { id: "3-col", label: "3열", icon: <Grid className="w-5 h-5" />, description: "3개씩 나란히" },
  { id: "1-2", label: "1+2", icon: <Rows className="w-5 h-5" />, description: "큰 이미지 1개 + 작은 2개" },
  { id: "2-1", label: "2+1", icon: <Rows className="w-5 h-5" />, description: "작은 2개 + 큰 이미지 1개" },
];

export function PhotoGridModal({ isOpen, onClose, onSubmit }: PhotoGridModalProps) {
  const [selectedLayout, setSelectedLayout] = useState<GridLayout>("auto");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles = files.filter(file => file.type.startsWith('image/'));
    if (validFiles.length === 0) return;

    setSelectedFiles(prev => [...prev, ...validFiles]);

    // Generate previews
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const removeImage = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    try {
      const uploadedUrls: string[] = [];
      
      for (const file of selectedFiles) {
        const url = await uploadImage(file, 'projects');
        uploadedUrls.push(url);
      }

      onSubmit(uploadedUrls, selectedLayout);
      
      // Reset state
      setSelectedFiles([]);
      setPreviews([]);
      setSelectedLayout("auto");
      onClose();
    } catch (error) {
      console.error("Image upload failed:", error);
      alert("이미지 업로드에 실패했습니다.");
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFiles([]);
    setPreviews([]);
    setSelectedLayout("auto");
    onClose();
  };

  // Preview grid based on layout
  const renderPreviewGrid = () => {
    if (previews.length === 0) {
      return (
        <div 
          className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-green-500 hover:bg-green-50/30 transition-all"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-12 h-12 text-gray-400 mb-4" />
          <p className="text-gray-600 font-medium">클릭하여 이미지 추가</p>
          <p className="text-gray-400 text-sm mt-1">또는 드래그 앤 드롭</p>
        </div>
      );
    }

    // Determine grid class based on layout and image count
    let gridClass = "grid gap-2";
    const count = previews.length;

    switch (selectedLayout) {
      case "2-col":
        gridClass += " grid-cols-2";
        break;
      case "3-col":
        gridClass += " grid-cols-3";
        break;
      case "1-2":
      case "2-1":
        // Special layout handled inline
        break;
      case "masonry":
        gridClass += " grid-cols-2 md:grid-cols-3";
        break;
      default: // auto
        if (count === 1) gridClass += " grid-cols-1";
        else if (count === 2) gridClass += " grid-cols-2";
        else if (count === 3) gridClass += " grid-cols-3";
        else if (count === 4) gridClass += " grid-cols-2";
        else gridClass += " grid-cols-3";
    }

    // Special layouts
    if (selectedLayout === "1-2" && previews.length >= 3) {
      return (
        <div className="space-y-2">
          <div className="relative aspect-video rounded-xl overflow-hidden group">
            <img src={previews[0]} alt="" className="w-full h-full object-cover" />
            <button 
              onClick={() => removeImage(0)}
              className="absolute top-2 right-2 w-8 h-8 bg-black/50 hover:bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {previews.slice(1, 3).map((preview, idx) => (
              <div key={idx + 1} className="relative aspect-square rounded-xl overflow-hidden group">
                <img src={preview} alt="" className="w-full h-full object-cover" />
                <button 
                  onClick={() => removeImage(idx + 1)}
                  className="absolute top-2 right-2 w-8 h-8 bg-black/50 hover:bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            ))}
          </div>
          {previews.length > 3 && (
            <div className={gridClass}>
              {previews.slice(3).map((preview, idx) => (
                <div key={idx + 3} className="relative aspect-square rounded-xl overflow-hidden group">
                  <img src={preview} alt="" className="w-full h-full object-cover" />
                  <button 
                    onClick={() => removeImage(idx + 3)}
                    className="absolute top-2 right-2 w-8 h-8 bg-black/50 hover:bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (selectedLayout === "2-1" && previews.length >= 3) {
      return (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            {previews.slice(0, 2).map((preview, idx) => (
              <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group">
                <img src={preview} alt="" className="w-full h-full object-cover" />
                <button 
                  onClick={() => removeImage(idx)}
                  className="absolute top-2 right-2 w-8 h-8 bg-black/50 hover:bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            ))}
          </div>
          <div className="relative aspect-video rounded-xl overflow-hidden group">
            <img src={previews[2]} alt="" className="w-full h-full object-cover" />
            <button 
              onClick={() => removeImage(2)}
              className="absolute top-2 right-2 w-8 h-8 bg-black/50 hover:bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
          {previews.length > 3 && (
            <div className={gridClass}>
              {previews.slice(3).map((preview, idx) => (
                <div key={idx + 3} className="relative aspect-square rounded-xl overflow-hidden group">
                  <img src={preview} alt="" className="w-full h-full object-cover" />
                  <button 
                    onClick={() => removeImage(idx + 3)}
                    className="absolute top-2 right-2 w-8 h-8 bg-black/50 hover:bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className={gridClass}>
        {previews.map((preview, idx) => (
          <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group">
            <img src={preview} alt="" className="w-full h-full object-cover" />
            <button 
              onClick={() => removeImage(idx)}
              className="absolute top-2 right-2 w-8 h-8 bg-black/50 hover:bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">포토 그리드 추가</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Layout Selection */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-700">레이아웃 선택</label>
            <div className="grid grid-cols-5 gap-2">
              {layoutOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setSelectedLayout(option.id)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                    selectedLayout === option.id
                      ? "border-green-500 bg-green-50 text-green-700"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {option.icon}
                  <span className="text-xs font-medium">{option.label}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500">
              {layoutOptions.find(o => o.id === selectedLayout)?.description}
            </p>
          </div>

          {/* Image Preview Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-gray-700">
                이미지 ({previews.length}개)
              </label>
              {previews.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  추가
                </Button>
              )}
            </div>
            
            {renderPreviewGrid()}
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              취소
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={previews.length === 0 || uploading}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {uploading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  업로드 중...
                </span>
              ) : (
                `그리드 삽입 (${previews.length}개)`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default PhotoGridModal;
