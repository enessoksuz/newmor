'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { TextAlign } from '@tiptap/extension-text-align';
import { Underline } from '@tiptap/extension-underline';
import { Link } from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
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
  AlignJustify,
  Link as LinkIcon,
  ImagePlus,
  Trash2,
  Edit2
} from 'lucide-react';
import { useState, useCallback } from 'react';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
}

export default function RichTextEditor({ content, onChange, placeholder, className = '' }: RichTextEditorProps) {
  const [linkUrl, setLinkUrl] = useState('');
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');

  const editor = useEditor({
    extensions: [
      StarterKit,
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
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: 'rounded-lg max-w-full h-auto cursor-pointer',
        },
      }),
    ],
    content,
    immediatelyRender: false, // SSR hydration hatası için
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[200px] p-4',
      },
    },
  });

  const addLink = () => {
    if (linkUrl && editor) {
      editor.chain().focus().setLink({ href: linkUrl }).run();
      setLinkUrl('');
      setShowLinkDialog(false);
    }
  };

  const removeLink = () => {
    if (editor) {
      editor.chain().focus().unsetLink().run();
    }
  };

  const addImage = useCallback(() => {
    if (imageUrl && editor) {
      editor.chain().focus().setImage({ 
        src: imageUrl,
        alt: imageAlt || 'Görsel'
      }).run();
      setImageUrl('');
      setImageAlt('');
      setShowImageDialog(false);
    }
  }, [editor, imageUrl, imageAlt]);

  const deleteImage = useCallback(() => {
    if (editor) {
      editor.chain().focus().deleteSelection().run();
    }
  }, [editor]);

  const updateImageUrl = useCallback(() => {
    if (editor && imageUrl) {
      editor.chain().focus().updateAttributes('image', {
        src: imageUrl,
        alt: imageAlt || 'Görsel'
      }).run();
      setImageUrl('');
      setImageAlt('');
      setShowImageDialog(false);
    }
  }, [editor, imageUrl, imageAlt]);

  if (!editor) {
    return null;
  }

  const MenuButton = ({ onClick, isActive, children, title }: any) => (
    <button
      onClick={onClick}
      className={`p-2 rounded hover:bg-gray-100 ${
        isActive ? 'bg-gray-200 text-blue-600' : 'text-gray-600'
      }`}
      title={title}
    >
      {children}
    </button>
  );

  return (
    <div className={`border border-gray-300 rounded-lg ${className}`}>
      {/* Toolbar */}
      <div className="border-b border-gray-300 p-2 flex flex-wrap items-center gap-1 bg-gray-50">
        {/* Text Formatting */}
        <MenuButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title="Kalın"
        >
          <Bold className="w-4 h-4" />
        </MenuButton>
        
        <MenuButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title="İtalik"
        >
          <Italic className="w-4 h-4" />
        </MenuButton>
        
        <MenuButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive('underline')}
          title="Altı Çizili"
        >
          <UnderlineIcon className="w-4 h-4" />
        </MenuButton>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Headings */}
        <MenuButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive('heading', { level: 1 })}
          title="Başlık 1"
        >
          H1
        </MenuButton>
        
        <MenuButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
          title="Başlık 2"
        >
          H2
        </MenuButton>
        
        <MenuButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive('heading', { level: 3 })}
          title="Başlık 3"
        >
          H3
        </MenuButton>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Lists */}
        <MenuButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          title="Madde İşaretli Liste"
        >
          <List className="w-4 h-4" />
        </MenuButton>
        
        <MenuButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          title="Numaralı Liste"
        >
          <ListOrdered className="w-4 h-4" />
        </MenuButton>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Alignment */}
        <MenuButton
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          isActive={editor.isActive({ textAlign: 'left' })}
          title="Sola Hizala"
        >
          <AlignLeft className="w-4 h-4" />
        </MenuButton>
        
        <MenuButton
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          isActive={editor.isActive({ textAlign: 'center' })}
          title="Ortala"
        >
          <AlignCenter className="w-4 h-4" />
        </MenuButton>
        
        <MenuButton
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          isActive={editor.isActive({ textAlign: 'right' })}
          title="Sağa Hizala"
        >
          <AlignRight className="w-4 h-4" />
        </MenuButton>
        
        <MenuButton
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          isActive={editor.isActive({ textAlign: 'justify' })}
          title="İki Yan Hizalı"
        >
          <AlignJustify className="w-4 h-4" />
        </MenuButton>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Quote */}
        <MenuButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          title="Alıntı"
        >
          <Quote className="w-4 h-4" />
        </MenuButton>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Link */}
        <MenuButton
          onClick={() => setShowLinkDialog(true)}
          isActive={editor.isActive('link')}
          title="Bağlantı Ekle"
        >
          <LinkIcon className="w-4 h-4" />
        </MenuButton>
        
        {editor.isActive('link') && (
          <MenuButton
            onClick={removeLink}
            title="Bağlantıyı Kaldır"
          >
            <span className="text-xs">Bağlantıyı Kaldır</span>
          </MenuButton>
        )}

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Image */}
        <MenuButton
          onClick={() => setShowImageDialog(true)}
          isActive={editor.isActive('image')}
          title="Görsel Ekle"
        >
          <ImagePlus className="w-4 h-4" />
        </MenuButton>
        
        {editor.isActive('image') && (
          <>
            <MenuButton
              onClick={() => {
                const attrs = editor.getAttributes('image');
                setImageUrl(attrs.src || '');
                setImageAlt(attrs.alt || '');
                setShowImageDialog(true);
              }}
              title="Görseli Düzenle"
            >
              <Edit2 className="w-4 h-4" />
            </MenuButton>
            <MenuButton
              onClick={deleteImage}
              title="Görseli Sil"
            >
              <Trash2 className="w-4 h-4 text-red-600" />
            </MenuButton>
          </>
        )}

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Undo/Redo */}
        <MenuButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Geri Al"
        >
          <Undo className="w-4 h-4" />
        </MenuButton>
        
        <MenuButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Yinele"
        >
          <Redo className="w-4 h-4" />
        </MenuButton>
      </div>

      {/* Link Dialog */}
      {showLinkDialog && (
        <div className="absolute z-10 bg-white border border-gray-300 rounded-lg shadow-lg p-4 mt-1">
          <div className="flex items-center space-x-2">
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="URL girin..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
            <button
              onClick={addLink}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Ekle
            </button>
            <button
              onClick={() => {
                setShowLinkDialog(false);
                setLinkUrl('');
              }}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              İptal
            </button>
          </div>
        </div>
      )}

      {/* Image Dialog */}
      {showImageDialog && (
        <div className="absolute z-10 bg-white border border-gray-300 rounded-lg shadow-lg p-4 mt-1 w-96">
          <h3 className="text-sm font-semibold mb-3">
            {editor.isActive('image') ? 'Görseli Düzenle' : 'Görsel Ekle'}
          </h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Görsel URL</label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="/uploads/image.jpg veya https://..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Alt Text (SEO)</label>
              <input
                type="text"
                value={imageAlt}
                onChange={(e) => setImageAlt(e.target.value)}
                placeholder="Görsel açıklaması..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
            {imageUrl && (
              <div className="mt-2">
                <img 
                  src={imageUrl} 
                  alt="Önizleme" 
                  className="max-w-full h-auto rounded border border-gray-200"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => {
                  setShowImageDialog(false);
                  setImageUrl('');
                  setImageAlt('');
                }}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                İptal
              </button>
              <button
                onClick={editor.isActive('image') ? updateImageUrl : addImage}
                disabled={!imageUrl}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {editor.isActive('image') ? 'Güncelle' : 'Ekle'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Editor Content */}
      <EditorContent 
        editor={editor} 
        className="min-h-[200px] max-h-[400px] overflow-y-auto"
      />
      
      {placeholder && !editor.getText() && (
        <div className="absolute top-16 left-4 text-gray-400 pointer-events-none">
          {placeholder}
        </div>
      )}
    </div>
  );
}
