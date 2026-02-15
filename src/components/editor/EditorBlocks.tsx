"use client";

import { useState } from "react";
import { X, Image, MonitorPlay, Code, Figma, Box, Video, Upload, Trash2, FileText, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { uploadFile } from "@/lib/supabase/storage";
import { Button } from "@/components/ui/button";

interface EmbedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (code: string) => void;
  type: "media" | "prototype" | "3d";
}

const modalConfigs = {
  media: {
    title: "미디어 임베드",
    subtitle: "Adobe XD, Vimeo, YouTube, GIPHY, SoundCloud, Spotify 등에서 공유",
    placeholder: "임베드 코드 붙여넣기\n\n예시:\n<iframe src=\"https://www.youtube.com/embed/...\" />\n\n또는 URL:\nhttps://www.youtube.com/watch?v=...",
  },
  prototype: {
    title: "프로토타입 임베드",
    subtitle: "XD, Figma, Marvel, Codepen 등에서 공유",
    placeholder: "임베드 코드 붙여넣기\n\n예시:\n<iframe src=\"https://www.figma.com/embed?...\" />\n\n또는 URL:\nhttps://www.figma.com/file/...",
  },
  "3d": {
    title: "3D 모델 임베드",
    subtitle: "Sketchfab, Spline, 등에서 공유",
    placeholder: "임베드 코드 붙여넣기\n\n예시:\n<iframe src=\"https://sketchfab.com/models/.../embed\" />\n\n또는 URL:\nhttps://sketchfab.com/3d-models/...",
  },
};

export function EmbedModal({ isOpen, onClose, onSubmit, type }: EmbedModalProps) {
  const [embedCode, setEmbedCode] = useState("");
  const config = modalConfigs[type];

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (embedCode.trim()) {
      onSubmit(embedCode.trim());
      setEmbedCode("");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{config.title}</h2>
            <p className="text-sm text-gray-500 mt-1">{config.subtitle}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            임베드 코드 붙여넣기
          </label>
          <textarea
            value={embedCode}
            onChange={(e) => setEmbedCode(e.target.value)}
            placeholder={config.placeholder}
            className="w-full h-48 p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none text-sm"
          />
          <p className="text-xs text-gray-400 mt-3">
            지원되는 임베드의 전체 목록을 확인하고{" "}
            <a href="#" className="text-blue-500 hover:underline">여기</a>
            에서 새 임베드를 요청하십시오.
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 p-6 border-t border-gray-100">
          <Button
            onClick={handleSubmit}
            disabled={!embedCode.trim()}
            className="bg-green-500 hover:bg-green-600 text-white px-6"
          >
            임베드
          </Button>
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-gray-500"
          >
            취소
          </Button>
        </div>
      </div>
    </div>
  );
}

// 포토 그리드 블록 컴포넌트
interface PhotoGridBlockProps {
  onAddImage: () => void;
  onAddLightroom?: () => void;
}

export function PhotoGridBlock({ onAddImage, onAddLightroom }: PhotoGridBlockProps) {
  return (
    <div className="border-2 border-blue-400 border-dashed rounded-xl bg-blue-50/30 p-12 my-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center">
          <div className="w-2 h-2 bg-white rounded-full"></div>
        </div>
        <button className="text-gray-400 hover:text-gray-600 flex items-center gap-1 text-sm">
          <span>&#x2190;&#x2192;</span>
        </button>
      </div>
      
      <div className="text-center py-12">
        <p className="text-lg text-gray-600 mb-8">그리드 제작을 위해 사진 추가:</p>
        <div className="flex justify-center gap-4">
          <button
            onClick={onAddImage}
            className="flex flex-col items-center gap-3 px-8 py-6 bg-white rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all group"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors">
              <Image className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-gray-700">이미지</span>
          </button>
          
          <button
            onClick={onAddLightroom}
            className="flex flex-col items-center gap-3 px-8 py-6 bg-white rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all group"
          >
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-gray-200 transition-colors">
              <MonitorPlay className="w-6 h-6 text-gray-600" />
            </div>
            <span className="text-sm font-medium text-gray-700">Lightroom</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// 텍스트 블록 컴포넌트 (검은 툴바 포함)
interface TextBlockProps {
  onTextChange?: (text: string) => void;
  initialText?: string;
}

export function TextBlockToolbar() {
  return (
    <div className="bg-gray-900 text-white rounded-lg p-2 flex items-center gap-1 mb-4 flex-wrap">
      <select className="bg-transparent border-0 text-sm px-2 py-1 appearance-none cursor-pointer hover:bg-gray-800 rounded">
        <option>단락</option>
        <option>제목 1</option>
        <option>제목 2</option>
        <option>제목 3</option>
      </select>
      
      <div className="w-px h-6 bg-gray-700 mx-1"></div>
      
      <select className="bg-transparent border-0 text-sm px-2 py-1 appearance-none cursor-pointer hover:bg-gray-800 rounded">
        <option>Helvetica</option>
        <option>Arial</option>
        <option>Georgia</option>
      </select>
      
      <div className="w-px h-6 bg-gray-700 mx-1"></div>
      
      <select className="bg-transparent border-0 text-sm px-2 py-1 w-16 appearance-none cursor-pointer hover:bg-gray-800 rounded">
        <option>20</option>
        <option>16</option>
        <option>14</option>
        <option>24</option>
        <option>32</option>
      </select>
      
      <div className="w-px h-6 bg-gray-700 mx-1"></div>
      
      <button className="p-2 hover:bg-gray-800 rounded" title="텍스트 색상">
        <span className="font-bold">T</span>
      </button>
      <button className="p-2 hover:bg-gray-800 rounded font-bold" title="굵게">B</button>
      <button className="p-2 hover:bg-gray-800 rounded italic" title="기울임">I</button>
      <button className="p-2 hover:bg-gray-800 rounded underline" title="밑줄">U</button>
      
      <div className="w-px h-6 bg-gray-700 mx-1"></div>
      
      <button className="p-2 hover:bg-gray-800 rounded" title="왼쪽 정렬">≡</button>
      <button className="p-2 hover:bg-gray-800 rounded" title="가운데 정렬">≡</button>
      <button className="p-2 hover:bg-gray-800 rounded" title="오른쪽 정렬">≡</button>
      
      <div className="w-px h-6 bg-gray-700 mx-1"></div>
      
      <button className="p-2 hover:bg-gray-800 rounded" title="링크">🔗</button>
      <button className="p-2 hover:bg-gray-800 rounded" title="이미지">🖼️</button>
      <button className="p-2 hover:bg-gray-800 rounded" title="텍스트 강조">Tx</button>
      <button className="p-2 hover:bg-gray-800 rounded" title="수식">Σ</button>
    </div>
  );
}

// 에셋 데이터 타입 정의
export interface Asset {
  name: string;
  url: string;
  size: number;
  type: string;
}

// 에셋 첨부 모달
interface AssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  assets: Asset[];
  onAssetsChange: (assets: Asset[]) => void;
}

export function AssetModal({ isOpen, onClose, assets = [], onAssetsChange }: AssetModalProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  if (!isOpen) return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFiles(e.target.files);
    }
  };

  const processFiles = async (fileList: FileList) => {
    setUploading(true);
    const newAssets: Asset[] = [];
    
    // 최대 5개 제한 체크
    if (assets.length + fileList.length > 5) {
      alert("최대 5개의 자산만 첨부할 수 있습니다.");
      setUploading(false);
      return;
    }

    try {
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        if (file.size > 500 * 1024 * 1024) { // 500MB Limit
            alert(`파일 ${file.name}의 크기가 500MB를 초과합니다.`);
            continue;
        }

        // Upload to Supabase ('project_assets' bucket recommended, falling back if logic inside uploadFile handles it)
        // Note: uploadFile implementation needs to support 'project_assets' bucket or similar.
        // Assuming uploadFile defaults to 'recruit_files' but we can pass bucket name.
        const result = await uploadFile(file, 'project_assets'); 
        newAssets.push(result);
      }
      
      onAssetsChange([...assets, ...newAssets]);
    } catch (error) {
      console.error("Upload failed", error);
      alert("파일 업로드 중 오류가 발생했습니다.");
    } finally {
      setUploading(false);
    }
  };

  const removeAsset = (index: number) => {
    const newAssets = [...assets];
    newAssets.splice(index, 1);
    onAssetsChange(newAssets);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-start justify-between p-8 border-b border-gray-50 bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">다운로드 가능한 자산 첨부</h2>
            <p className="text-sm text-gray-500 mt-2">다른 사용자들이 내 프로젝트 소스나 리소스를 다운로드할 수 있게 공유하세요.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar">
          {/* Upload Area */}
          <div className="space-y-4">
             <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-gray-900 uppercase tracking-widest">새 자산 추가</p>
                <span className="text-xs font-medium text-gray-400 text-right">
                    JPG, PNG, PSD, AI, PDF, ZIP 등<br/>최대 500MB
                </span>
             </div>
            
            <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative group border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-300 ${
                    isDragging ? "border-green-500 bg-green-50/50 scale-[0.99]" : "border-slate-200 hover:border-slate-300 bg-slate-50/30 hover:bg-slate-50"
                }`}
            >
                {uploading ? (
                    <div className="flex flex-col items-center justify-center py-4">
                        <Loader2 className="w-10 h-10 text-green-500 animate-spin mb-4" />
                        <p className="text-sm font-bold text-slate-700">파일을 업로드하고 있습니다...</p>
                        <p className="text-xs text-slate-400 mt-1">잠시만 기다려주세요.</p>
                    </div>
                ) : (
                    <>
                        <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                            <Upload className="w-8 h-8 text-slate-400 group-hover:text-green-500 transition-colors" />
                        </div>
                        <p className="text-lg font-bold text-slate-700 mb-2">
                            파일을 여기로 드래그하거나 클릭하여 선택
                        </p>
                        <p className="text-sm text-slate-400 max-w-sm mx-auto">
                            프로젝트와 관련된 소스 파일, 고화질 이미지 등을 공유할 수 있습니다.
                        </p>
                        <input 
                            type="file" 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                            multiple 
                            onChange={handleFileSelect} 
                            disabled={uploading}
                        />
                    </>
                )}
            </div>
          </div>

          {/* Attached Assets List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <p className="text-sm font-bold text-gray-900 uppercase tracking-widest">첨부된 자산 목록</p>
                <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-1 rounded-md">
                    {assets.length} / 5
                </span>
            </div>
            
            {assets.length === 0 ? (
                <div className="h-32 border border-slate-200 border-dashed rounded-xl flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
                    <FileText className="w-8 h-8 opacity-20 mb-2" />
                    <p className="text-sm">추가된 자산이 없습니다.</p>
                </div>
            ) : (
                <div className="grid gap-3">
                    {assets.map((asset, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md transition-all group">
                            <div className="flex items-center gap-4 overflow-hidden">
                                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0 text-slate-500 font-bold text-xs uppercase">
                                    {asset.type.split('/')[1] || 'FILE'}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-slate-800 truncate">{asset.name}</p>
                                    <p className="text-xs text-slate-400">{(asset.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => removeAsset(idx)}
                                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
            <div className="bg-slate-50 p-4 rounded-xl flex gap-3 text-xs text-slate-500 border border-slate-100">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-slate-400" />
                <p>업로드된 파일은 누구나 다운로드할 수 있습니다. 저작권에 문제가 없는 파일만 공유해 주세요.</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-50 bg-white">
          <Button onClick={onClose} className="bg-slate-900 hover:bg-slate-800 text-white px-8 h-12 rounded-xl font-bold shadow-lg shadow-slate-200 transition-all active:scale-95">
             완료 및 저장
          </Button>
        </div>
      </div>
    </div>
  );
}

// 프로젝트 스타일 모달
interface StyleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (bgColor: string, spacing: number) => void;
  initialBgColor?: string;
  initialSpacing?: number;
}

export function StyleModal({ isOpen, onClose, onSave, initialBgColor = "#FFFFFF", initialSpacing = 60 }: StyleModalProps) {
  const [bgColor, setBgColor] = useState(initialBgColor);
  const [spacing, setSpacing] = useState(initialSpacing);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">프로젝트 스타일</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <label className="font-medium text-gray-700">배경색</label>
            <div className="flex items-center gap-2">
              <input 
                type="color" 
                value={bgColor} 
                onChange={(e) => setBgColor(e.target.value)}
                className="w-10 h-10 rounded cursor-pointer border-0"
              />
              <span className="text-gray-400">또는</span>
              <span className="text-gray-700">#</span>
              <input
                type="text"
                value={bgColor.replace('#', '')}
                onChange={(e) => setBgColor('#' + e.target.value)}
                className="w-20 px-2 py-1 border border-gray-200 rounded text-sm"
                maxLength={6}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="font-medium text-gray-700">콘텐츠 간격</label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0"
                max="120"
                value={spacing}
                onChange={(e) => setSpacing(parseInt(e.target.value))}
                className="w-32 accent-blue-600"
              />
              <span className="text-sm text-gray-600 w-16">{spacing} px</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-6 border-t border-gray-100">
          <Button onClick={() => { onSave(bgColor, spacing); onClose(); }} className="bg-blue-600 hover:bg-blue-700 text-white px-8">저장</Button>
          <Button variant="ghost" onClick={onClose} className="text-gray-500">취소</Button>
        </div>
      </div>
    </div>
  );
}

// 사용자 정의 버튼 모달
interface CTAButtonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (type: "follow" | "none") => void;
}

export function CTAButtonModal({ isOpen, onClose, onSave }: CTAButtonModalProps) {
  const [selectedType, setSelectedType] = useState<"follow" | "none">("follow");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">버튼 사용자 정의</h2>
            <p className="text-sm text-gray-500 mt-1">프로젝트에 대한 콜 투 액션 맞춤화</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-medium text-gray-700">링크 방문 수</span>
              <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-medium">PRO</span>
            </div>
            <p className="text-sm text-gray-500 mb-3">내 링크의 방문 수 늘리기</p>
            <button className="text-sm text-blue-600 font-medium hover:underline flex items-center gap-1">
              <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">PRO</span>
              업그레이드하여 사용자 정의 링크로 뷰어를 직접 연결 →
            </button>
          </div>

          <div 
            onClick={() => setSelectedType("follow")}
            className={`p-4 rounded-xl cursor-pointer transition-all ${selectedType === "follow" ? "border-2 border-blue-500 bg-blue-50" : "border border-gray-200 hover:border-gray-300"}`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedType === "follow" ? "border-blue-500" : "border-gray-300"}`}>
                {selectedType === "follow" && <div className="w-3 h-3 rounded-full bg-blue-500"></div>}
              </div>
              <div>
                <p className="font-medium text-gray-700">팔로우 및 평가</p>
                <p className="text-sm text-gray-500">팔로워를 늘리고 프로젝트 평가 점수 높이기</p>
              </div>
            </div>
          </div>

          <div 
            onClick={() => setSelectedType("none")}
            className={`p-4 rounded-xl cursor-pointer transition-all ${selectedType === "none" ? "border-2 border-blue-500 bg-blue-50" : "border border-gray-200 hover:border-gray-300"}`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedType === "none" ? "border-blue-500" : "border-gray-300"}`}>
                {selectedType === "none" && <div className="w-3 h-3 rounded-full bg-blue-500"></div>}
              </div>
              <div>
                <p className="font-medium text-gray-700">콜 투 액션 없음</p>
                <p className="text-sm text-gray-500">프로젝트에 사용자 정의 버튼을 원하지 않는 경우 이 옵션을 선택하세요.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-6 border-t border-gray-100">
          <Button onClick={() => { onSave(selectedType); onClose(); }} className="bg-blue-600 hover:bg-blue-700 text-white px-8">완료</Button>
          <Button variant="ghost" className="text-gray-500">미리보기 실행</Button>
        </div>
      </div>
    </div>
  );
}

// 프로젝트 설정 모달 (3D 임베드 모달에서 재사용)
interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: any) => void;
}

export function SettingsModal({ isOpen, onClose, onSave }: SettingsModalProps) {
  const [title, setTitle] = useState("");
  const [tagList, setTagList] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [visibility, setVisibility] = useState("public");
  const [isAdult, setIsAdult] = useState(false);

  // 장르 데이터 정의
  const genres = [
    { id: "photo", label: "포토", icon: "📷" },
    { id: "animation", label: "애니메이션", icon: "🪄" },
    { id: "graphic", label: "그래픽", icon: "🎨" },
    { id: "design", label: "디자인", icon: "📎" },
    { id: "video", label: "영상", icon: "📹" },
    { id: "movie", label: "영화·드라마", icon: "🎞️" },
    { id: "audio", label: "오디오", icon: "🎧" },
    { id: "3d", label: "3D", icon: "🧊" },
    { id: "text", label: "텍스트", icon: "📄" },
    { id: "code", label: "코드", icon: "💻" },
    { id: "app", label: "웹/앱", icon: "📱" },
    { id: "game", label: "게임", icon: "🎮" },
  ];

  // 관련 분야 데이터 정의
  const fields = ["경제/금융", "헬스케어", "뷰티/패션", "반려", "F&B", "여행/레저", "교육", "IT", "라이프스타일", "비즈니스", "문화/예술", "마케팅", "기타"];

  const toggleGenre = (id: string) => {
    setSelectedGenres(prev => 
      prev.includes(id) ? prev.filter(g => g !== id) : prev.length < 3 ? [...prev, id] : prev
    );
  };

  const toggleField = (id: string) => {
    setSelectedFields(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tagList.includes(tagInput.trim()) && tagList.length < 10) {
        setTagList([...tagList, tagInput.trim()]);
      }
      setTagInput("");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-8 border-b border-gray-50 flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">프로젝트 설정</h2>
            <p className="text-sm text-gray-500 mt-1">제 평가는요?에 당신의 감각을 게시할 준비를 하세요.</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-gray-100 rounded-full transition-all group">
            <X className="w-6 h-6 text-gray-400 group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="space-y-12">
            
            {/* 1. 타이틀 섹션 */}
            <div className="space-y-3">
              <label className="flex items-center gap-1.5 text-sm font-bold text-gray-900 uppercase tracking-widest leading-none">
                프로젝트 제목 <span className="text-red-500">*</span>
              </label>
              <input 
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="제목을 입력해 주세요"
                className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-black transition-all outline-none text-lg font-medium shadow-sm active:scale-[0.99]"
              />
            </div>

            {/* 2. 작품 장르 칩 섹션 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-gray-900 uppercase tracking-widest">
                  작품 장르 <span className="text-gray-400 font-normal ml-2">최대 3개 선택 가능</span>
                </label>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {genres.map((genre) => (
                  <button
                    key={genre.id}
                    onClick={() => toggleGenre(genre.id)}
                    className={`flex items-center justify-center gap-2 h-12 px-4 rounded-xl border-2 transition-all transform active:scale-95 ${
                      selectedGenres.includes(genre.id)
                        ? "border-black bg-black text-white shadow-lg"
                        : "border-gray-100 bg-white hover:border-gray-300 text-gray-700"
                    }`}
                  >
                    <span className="text-lg">{genre.icon}</span>
                    <span className="text-xs font-bold">{genre.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. 관련 분야 섹션 */}
            <div className="space-y-4">
              <label className="text-sm font-bold text-gray-900 uppercase tracking-widest">
                관련 분야 <span className="text-gray-400 font-normal ml-2">(선택)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {fields.map((field) => (
                  <button
                    key={field}
                    onClick={() => toggleField(field)}
                    className={`px-5 py-2.5 rounded-full border text-xs font-bold transition-all active:scale-95 ${
                      selectedFields.includes(field)
                        ? "bg-gray-900 border-gray-900 text-white shadow-md"
                        : "bg-white border-gray-200 text-gray-600 hover:border-gray-400"
                    }`}
                  >
                    {field}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. 태그 및 가시성 설정 (2열 배치) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-sm font-bold text-gray-900 uppercase tracking-widest">태그</label>
                <div className="relative">
                  <input 
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    placeholder="태그 입력 후 Enter"
                    className="w-full pl-5 pr-12 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-black transition-all outline-none text-sm"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 text-sm font-bold">↵</div>
                </div>
                <div className="flex flex-wrap gap-1.5 min-h-[32px]">
                  {tagList.map(tag => (
                    <span key={tag} className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-[11px] font-bold flex items-center gap-1.5 border border-indigo-100">
                      #{tag}
                      <button onClick={() => setTagList(tagList.filter(t => t !== tag))} className="hover:text-red-500"><X size={10} /></button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-bold text-gray-900 uppercase tracking-widest">공개 설정</label>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => setVisibility("public")}
                    className={`px-4 py-4 rounded-2xl border-2 text-center transition-all ${visibility === "public" ? "border-black bg-black text-white" : "border-gray-100 hover:bg-gray-100"}`}
                  >
                    <p className="font-bold text-xs">전체 공개</p>
                  </button>
                  <button 
                    onClick={() => setVisibility("private")}
                    className={`px-4 py-4 rounded-2xl border-2 text-center transition-all ${visibility === "private" ? "border-black bg-black text-white" : "border-gray-100 hover:bg-gray-100"}`}
                  >
                    <p className="font-bold text-xs">비공개</p>
                  </button>
                </div>
              </div>
            </div>

            {/* 5. 성인 콘텐츠 설정 */}
            <div className="flex items-center justify-between p-6 bg-gray-50 rounded-xl border border-gray-100">
              <div>
                <p className="font-bold text-gray-900 text-sm">민감한 콘텐츠 포함</p>
                <p className="text-[11px] text-gray-500 mt-0.5">성인물 또는 폭력적인 내용이 포함되어 있나요?</p>
              </div>
              <div 
                onClick={() => setIsAdult(!isAdult)}
                className={`w-14 h-8 rounded-full p-1.5 cursor-pointer transition-all duration-300 ${isAdult ? "bg-red-500 shadow-inner" : "bg-gray-300"}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow-lg transform transition-transform duration-300 ${isAdult ? "translate-x-6" : ""}`} />
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-8 border-t border-gray-50 bg-white flex-shrink-0">
          <Button variant="ghost" onClick={onClose} className="text-gray-500 px-8 rounded-full">취소</Button>
          <Button 
            onClick={() => { onSave({ title, tagList, selectedGenres, selectedFields, visibility, isAdult }); onClose(); }} 
            disabled={!title || selectedGenres.length === 0}
            className="bg-green-500 hover:bg-green-600 text-white px-14 py-7 rounded-full font-bold shadow-xl shadow-green-200 transition-all disabled:opacity-30 active:scale-95 flex items-center gap-3"
          >
            <span>프로젝트 발행하기</span>
            <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] tracking-widest font-black uppercase">Publish</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

