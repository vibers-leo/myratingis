/**
 * Block Editor for Portfolio Upload
 * 
 * Architecture:
 * - Block-based content editor similar to Notion/Behance
 * - Supports multiple content types (text, image, video, audio, code)
 * - Drag & drop reordering
 * - Auto-save to localStorage
 * 
 * Block Types:
 * 1. Heading (H1, H2, H3)
 * 2. Paragraph (rich text)
 * 3. Image (upload + caption)
 * 4. Video (YouTube/Vimeo embed or upload)
 * 5. Audio (upload)
 * 6. Quote
 * 7. Code
 * 8. Divider
 */

export interface Block {
  id: string;
  type: 'heading' | 'paragraph' | 'image' | 'video' | 'audio' | 'quote' | 'code' | 'divider';
  content: any;
  order: number;
}

export interface HeadingBlock extends Block {
  type: 'heading';
  content: {
    level: 1 | 2 | 3;
    text: string;
  };
}

export interface ParagraphBlock extends Block {
  type: 'paragraph';
  content: {
    text: string; // HTML or Markdown
  };
}

export interface ImageBlock extends Block {
  type: 'image';
  content: {
    url: string;
    caption?: string;
    alt?: string;
  };
}

export interface VideoBlock extends Block {
  type: 'video';
  content: {
    url: string; // YouTube/Vimeo URL or uploaded file URL
    caption?: string;
  };
}

export interface AudioBlock extends Block {
  type: 'audio';
  content: {
    url: string;
    title?: string;
  };
}

export interface QuoteBlock extends Block {
  type: 'quote';
  content: {
    text: string;
    author?: string;
  };
}

export interface CodeBlock extends Block {
  type: 'code';
  content: {
    code: string;
    language?: string;
  };
}

export interface DividerBlock extends Block {
  type: 'divider';
  content: null;
}

export type ContentBlock = 
  | HeadingBlock 
  | ParagraphBlock 
  | ImageBlock 
  | VideoBlock 
  | AudioBlock 
  | QuoteBlock 
  | CodeBlock 
  | DividerBlock;
