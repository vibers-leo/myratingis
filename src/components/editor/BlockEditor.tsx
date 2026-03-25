"use client";

import { useState, useCallback } from "react";
import { ContentBlock } from "@/types/editor";
import { Button } from "@/components/ui/button";
import { 
  Type, 
  Image as ImageIcon, 
  Video, 
  Music, 
  Quote, 
  Code, 
  Minus,
  Plus,
  GripVertical
} from "lucide-react";

interface BlockEditorProps {
  initialBlocks?: ContentBlock[];
  onChange?: (blocks: ContentBlock[]) => void;
}

export function BlockEditor({ initialBlocks = [], onChange }: BlockEditorProps) {
  const [blocks, setBlocks] = useState<ContentBlock[]>(initialBlocks);
  const [showBlockMenu, setShowBlockMenu] = useState(false);

  const addBlock = useCallback((type: ContentBlock['type']) => {
    const newBlock: ContentBlock = {
      id: `block-${Date.now()}`,
      type,
      content: getDefaultContent(type),
      order: blocks.length,
    } as ContentBlock;

    const updatedBlocks = [...blocks, newBlock];
    setBlocks(updatedBlocks);
    onChange?.(updatedBlocks);
    setShowBlockMenu(false);
  }, [blocks, onChange]);

  const updateBlock = useCallback((id: string, content: any) => {
    const updatedBlocks = blocks.map(block =>
      block.id === id ? { ...block, content } : block
    );
    setBlocks(updatedBlocks);
    onChange?.(updatedBlocks);
  }, [blocks, onChange]);

  const deleteBlock = useCallback((id: string) => {
    const updatedBlocks = blocks.filter(block => block.id !== id);
    setBlocks(updatedBlocks);
    onChange?.(updatedBlocks);
  }, [blocks, onChange]);

  const blockTypes = [
    { type: 'heading' as const, icon: Type, label: '제목' },
    { type: 'paragraph' as const, icon: Type, label: '텍스트' },
    { type: 'image' as const, icon: ImageIcon, label: '이미지' },
    { type: 'video' as const, icon: Video, label: '영상' },
    { type: 'audio' as const, icon: Music, label: '오디오' },
    { type: 'quote' as const, icon: Quote, label: '인용구' },
    { type: 'code' as const, icon: Code, label: '코드' },
    { type: 'divider' as const, icon: Minus, label: '구분선' },
  ];

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Editor Canvas */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 min-h-[600px] p-8 space-y-4">
        {blocks.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <Plus className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">블록을 추가하여 작성을 시작하세요</p>
          </div>
        )}

        {blocks.map((block, index) => (
          <BlockRenderer
            key={block.id}
            block={block}
            onUpdate={(content) => updateBlock(block.id, content)}
            onDelete={() => deleteBlock(block.id)}
          />
        ))}

        {/* Add Block Button */}
        <div className="relative">
          <Button
            onClick={() => setShowBlockMenu(!showBlockMenu)}
            variant="outline"
            className="w-full border-dashed border-2 hover:border-green-500 hover:bg-green-50 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            블록 추가
          </Button>

          {/* Block Type Menu */}
          {showBlockMenu && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 p-2 grid grid-cols-2 gap-2 z-10">
              {blockTypes.map(({ type, icon: Icon, label }) => (
                <button
                  key={type}
                  onClick={() => addBlock(type)}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-gray-600" />
                  </div>
                  <span className="font-medium text-sm">{label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Block Renderer Component
function BlockRenderer({ 
  block, 
  onUpdate, 
  onDelete 
}: { 
  block: ContentBlock; 
  onUpdate: (content: any) => void;
  onDelete: () => void;
}) {
  switch (block.type) {
    case 'heading':
      return (
        <div className="group relative">
          <div className="absolute -left-12 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            <button className="p-1 hover:bg-gray-100 rounded">
              <GripVertical className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          <input
            type="text"
            value={block.content.text || ''}
            onChange={(e) => onUpdate({ ...block.content, text: e.target.value })}
            placeholder="제목을 입력하세요"
            className="w-full text-3xl font-bold border-none outline-none focus:ring-0 p-2"
          />
        </div>
      );

    case 'paragraph':
      return (
        <div className="group relative">
          <div className="absolute -left-12 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button className="p-1 hover:bg-gray-100 rounded">
              <GripVertical className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          <textarea
            value={block.content.text || ''}
            onChange={(e) => onUpdate({ ...block.content, text: e.target.value })}
            placeholder="내용을 입력하세요"
            className="w-full min-h-[100px] border-none outline-none focus:ring-0 p-2 resize-none"
          />
        </div>
      );

    case 'image':
      return (
        <div className="group relative border-2 border-dashed border-gray-300 rounded-xl p-8 hover:border-green-500 transition-colors">
          <div className="text-center">
            <ImageIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-sm text-gray-500">이미지를 업로드하거나 URL을 입력하세요</p>
            <input
              type="text"
              placeholder="이미지 URL"
              className="mt-4 w-full max-w-md mx-auto px-4 py-2 border border-gray-300 rounded-lg"
              onChange={(e) => onUpdate({ ...block.content, url: e.target.value })}
            />
          </div>
        </div>
      );

    case 'divider':
      return (
        <div className="group relative py-4">
          <hr className="border-gray-300" />
        </div>
      );

    default:
      return (
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500">
            {block.type} 블록 (개발 중)
          </p>
        </div>
      );
  }
}

function getDefaultContent(type: ContentBlock['type']): any {
  switch (type) {
    case 'heading':
      return { level: 1, text: '' };
    case 'paragraph':
      return { text: '' };
    case 'image':
      return { url: '', caption: '', alt: '' };
    case 'video':
      return { url: '', caption: '' };
    case 'audio':
      return { url: '', title: '' };
    case 'quote':
      return { text: '', author: '' };
    case 'code':
      return { code: '', language: 'javascript' };
    case 'divider':
      return null;
    default:
      return {};
  }
}
