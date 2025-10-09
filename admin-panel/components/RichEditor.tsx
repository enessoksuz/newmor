'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { TextAlign } from '@tiptap/extension-text-align';
import { Underline } from '@tiptap/extension-underline';
import { Link } from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Youtube from '@tiptap/extension-youtube';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  List, 
  ListOrdered, 
  Quote, 
  Undo, 
  Redo,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  ImagePlus,
  Youtube as YoutubeIcon,
  Heading1,
  Heading2,
  Heading3,
  Trash2,
  Check,
  X
} from 'lucide-react';
import { useState, useCallback, useEffect } from 'react';

interface RichEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  minimal?: boolean; // Biyografi gibi kısa metinler için
  showStats?: boolean; // Karakter/kelime sayısını göster
}

export default function RichEditor({ 
  content, 
  onChange, 
  placeholder = 'Yazmaya başlayın...', 
  minimal = false,
  showStats = true 
}: RichEditorProps) {
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [showYoutubeInput, setShowYoutubeInput] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [selectedImage, setSelectedImage] = useState<any>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: minimal ? false : {
          levels: [1, 2, 3],
        },
      }),
      TextStyle,
      Color,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline hover:text-blue-800',
        },
      }),
      Image.configure({
        inline: false,
        allowBase64: true,
        HTMLAttributes: {
          class: 'rounded-lg max-w-full h-auto my-4 cursor-pointer border-2 border-transparent hover:border-blue-400 transition-all',
        },
      }),
      Youtube.configure({
        width: 640,
        height: 360,
        HTMLAttributes: {
          class: 'rounded-lg my-4',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      CharacterCount,
    ],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    onSelectionUpdate: ({ editor }) => {
      // Görsel seçiliyse bilgilerini al
      if (editor.isActive('image')) {
        const attrs = editor.getAttributes('image');
        setSelectedImage(attrs);
      } else {
        setSelectedImage(null);
      }
    },
    editorProps: {
      attributes: {
        class: minimal 
          ? 'focus:outline-none min-h-[100px] p-3'
          : 'focus:outline-none min-h-[300px] p-4',
      },
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  const addLink = useCallback(() => {
    if (linkUrl && editor) {
      editor.chain().focus().setLink({ href: linkUrl }).run();
      setLinkUrl('');
      setShowLinkInput(false);
    }
  }, [editor, linkUrl]);

  const addImage = useCallback(() => {
    if (imageUrl && editor) {
      if (selectedImage) {
        // Güncelle
        editor.chain().focus().updateAttributes('image', {
          src: imageUrl,
          alt: imageAlt || 'Görsel',
        }).run();
      } else {
        // Yeni ekle
        editor.chain().focus().setImage({ 
          src: imageUrl,
          alt: imageAlt || 'Görsel',
        }).run();
      }
      setImageUrl('');
      setImageAlt('');
      setShowImageInput(false);
    }
  }, [editor, imageUrl, imageAlt, selectedImage]);

  const addYoutube = useCallback(() => {
    if (youtubeUrl && editor) {
      editor.chain().focus().setYoutubeVideo({ src: youtubeUrl }).run();
      setYoutubeUrl('');
      setShowYoutubeInput(false);
    }
  }, [editor, youtubeUrl]);

  const deleteSelectedImage = useCallback(() => {
    if (editor) {
      editor.chain().focus().deleteSelection().run();
      setSelectedImage(null);
    }
  }, [editor]);

  if (!editor) {
    return (
      <div className="border border-gray-300 rounded-lg p-4 min-h-[200px] bg-gray-50 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  const ToolbarButton = ({ onClick, isActive, disabled, children, title }: any) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`p-2 rounded transition-colors ${
        isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
      } ${disabled ? 'opacity-30 cursor-not-allowed' : ''}`}
      title={title}
    >
      {children}
    </button>
  );

  return (
    <div className="border border-gray-300 rounded-lg bg-white shadow-sm overflow-hidden">
      {/* Toolbar */}
      <div className="border-b border-gray-200 p-2 bg-gray-50 flex flex-wrap items-center gap-1">
        {/* Text Formatting */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title="Kalın (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </ToolbarButton>
        
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title="İtalik (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </ToolbarButton>
        
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive('underline')}
          title="Altı Çizili"
        >
          <UnderlineIcon className="w-4 h-4" />
        </ToolbarButton>

        {!minimal && (
          <>
            <div className="w-px h-6 bg-gray-300 mx-1" />

            {/* Headings */}
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              isActive={editor.isActive('heading', { level: 1 })}
              title="Başlık 1"
            >
              <Heading1 className="w-4 h-4" />
            </ToolbarButton>
            
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              isActive={editor.isActive('heading', { level: 2 })}
              title="Başlık 2"
            >
              <Heading2 className="w-4 h-4" />
            </ToolbarButton>
            
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              isActive={editor.isActive('heading', { level: 3 })}
              title="Başlık 3"
            >
              <Heading3 className="w-4 h-4" />
            </ToolbarButton>
          </>
        )}

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Lists */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          title="Madde İşaretli Liste"
        >
          <List className="w-4 h-4" />
        </ToolbarButton>
        
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          title="Numaralı Liste"
        >
          <ListOrdered className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          title="Alıntı"
        >
          <Quote className="w-4 h-4" />
        </ToolbarButton>

        {!minimal && (
          <>
            <div className="w-px h-6 bg-gray-300 mx-1" />

            {/* Alignment */}
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
              isActive={editor.isActive({ textAlign: 'left' })}
              title="Sola Hizala"
            >
              <AlignLeft className="w-4 h-4" />
            </ToolbarButton>
            
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
              isActive={editor.isActive({ textAlign: 'center' })}
              title="Ortala"
            >
              <AlignCenter className="w-4 h-4" />
            </ToolbarButton>
            
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
              isActive={editor.isActive({ textAlign: 'right' })}
              title="Sağa Hizala"
            >
              <AlignRight className="w-4 h-4" />
            </ToolbarButton>
          </>
        )}

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Link */}
        <ToolbarButton
          onClick={() => setShowLinkInput(!showLinkInput)}
          isActive={editor.isActive('link')}
          title="Bağlantı"
        >
          <LinkIcon className="w-4 h-4" />
        </ToolbarButton>

        {!minimal && (
          <>
            {/* Image */}
            <ToolbarButton
              onClick={() => {
                if (selectedImage) {
                  setImageUrl(selectedImage.src || '');
                  setImageAlt(selectedImage.alt || '');
                }
                setShowImageInput(true);
              }}
              isActive={editor.isActive('image')}
              title={selectedImage ? 'Görseli Düzenle' : 'Görsel Ekle'}
            >
              <ImagePlus className="w-4 h-4" />
            </ToolbarButton>

            {selectedImage && (
              <ToolbarButton
                onClick={deleteSelectedImage}
                title="Görseli Sil"
              >
                <Trash2 className="w-4 h-4 text-red-600" />
              </ToolbarButton>
            )}

            {/* YouTube */}
            <ToolbarButton
              onClick={() => setShowYoutubeInput(!showYoutubeInput)}
              title="YouTube Video"
            >
              <YoutubeIcon className="w-4 h-4" />
            </ToolbarButton>
          </>
        )}

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Undo/Redo */}
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Geri Al"
        >
          <Undo className="w-4 h-4" />
        </ToolbarButton>
        
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Yinele"
        >
          <Redo className="w-4 h-4" />
        </ToolbarButton>
      </div>

      {/* Inline Inputs */}
      {showLinkInput && (
        <div className="border-b border-gray-200 p-3 bg-blue-50 flex items-center gap-2">
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addLink()}
            placeholder="https://example.com"
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            autoFocus
          />
          <button
            onClick={addLink}
            className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            title="Ekle"
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setShowLinkInput(false);
              setLinkUrl('');
            }}
            className="p-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            title="İptal"
          >
            <X className="w-4 h-4" />
          </button>
          {editor.isActive('link') && (
            <button
              onClick={() => {
                editor.chain().focus().unsetLink().run();
                setShowLinkInput(false);
              }}
              className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200"
              title="Bağlantıyı Kaldır"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {showImageInput && (
        <div className="border-b border-gray-200 p-3 bg-green-50">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="/uploads/image.jpg"
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                autoFocus
              />
              <input
                type="text"
                value={imageAlt}
                onChange={(e) => setImageAlt(e.target.value)}
                placeholder="Alt text (SEO)"
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <button
                onClick={addImage}
                disabled={!imageUrl}
                className="p-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                title={selectedImage ? 'Güncelle' : 'Ekle'}
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setShowImageInput(false);
                  setImageUrl('');
                  setImageAlt('');
                }}
                className="p-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                title="İptal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {imageUrl && (
              <img 
                src={imageUrl} 
                alt="Önizleme" 
                className="max-w-xs h-auto rounded border border-gray-300"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}
          </div>
        </div>
      )}

      {showYoutubeInput && (
        <div className="border-b border-gray-200 p-3 bg-red-50 flex items-center gap-2">
          <input
            type="url"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addYoutube()}
            placeholder="https://www.youtube.com/watch?v=..."
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-transparent"
            autoFocus
          />
          <button
            onClick={addYoutube}
            disabled={!youtubeUrl}
            className="p-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-300"
            title="Ekle"
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setShowYoutubeInput(false);
              setYoutubeUrl('');
            }}
            className="p-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            title="İptal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Seçili Görsel Bilgisi */}
      {selectedImage && (
        <div className="border-b border-blue-200 bg-blue-50 p-2 text-xs text-blue-800 flex items-center justify-between">
          <span className="font-medium">✓ Görsel seçili: {selectedImage.alt || 'İsimsiz'}</span>
          <span className="text-blue-600">Düzenlemek için "Görsel Ekle" butonuna tıklayın</span>
        </div>
      )}

      {/* Editor */}
      <EditorContent 
        editor={editor} 
        className={minimal ? 'max-h-[200px] overflow-y-auto' : 'max-h-[500px] overflow-y-auto'}
      />

      {/* Stats */}
      {showStats && (
        <div className="border-t border-gray-200 px-3 py-2 text-xs text-gray-500 flex justify-between bg-gray-50">
          <span>{editor.storage.characterCount.characters()} karakter</span>
          <span>{editor.storage.characterCount.words()} kelime</span>
        </div>
      )}
    </div>
  );
}

