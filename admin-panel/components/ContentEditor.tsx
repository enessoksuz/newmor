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
  AlignJustify,
  Link as LinkIcon,
  ImagePlus,
  Youtube as YoutubeIcon,
  Twitter,
  Instagram,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Type,
  Minus,
  Trash2
} from 'lucide-react';
import { useState, useCallback, useEffect } from 'react';

interface ContentEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
}

// Twitter Embed Extension
const TwitterEmbed = Image.extend({
  name: 'twitterEmbed',
  
  addAttributes() {
    return {
      ...this.parent?.(),
      tweetId: {
        default: null,
      },
    };
  },
  
  parseHTML() {
    return [
      {
        tag: 'div[data-tweet-id]',
      },
    ];
  },
  
  renderHTML({ HTMLAttributes }) {
    return ['div', { 'data-tweet-id': HTMLAttributes.tweetId, class: 'twitter-embed' }, 0];
  },
});

// Instagram Embed Extension
const InstagramEmbed = Image.extend({
  name: 'instagramEmbed',
  
  addAttributes() {
    return {
      ...this.parent?.(),
      postUrl: {
        default: null,
      },
    };
  },
  
  parseHTML() {
    return [
      {
        tag: 'div[data-instagram-url]',
      },
    ];
  },
  
  renderHTML({ HTMLAttributes }) {
    return ['div', { 'data-instagram-url': HTMLAttributes.postUrl, class: 'instagram-embed' }, 0];
  },
});

export default function ContentEditor({ content, onChange, placeholder = 'İçeriğinizi yazmaya başlayın veya / yazarak komutları görün...', className = '' }: ContentEditorProps) {
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [showYoutubeDialog, setShowYoutubeDialog] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [showTwitterDialog, setShowTwitterDialog] = useState(false);
  const [twitterUrl, setTwitterUrl] = useState('');
  const [showInstagramDialog, setShowInstagramDialog] = useState(false);
  const [instagramUrl, setInstagramUrl] = useState('');

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
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
          class: 'rounded-lg max-w-full h-auto my-4 cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all',
        },
      }),
      Youtube.configure({
        width: 640,
        height: 360,
        HTMLAttributes: {
          class: 'rounded-lg my-4',
        },
      }),
      TwitterEmbed,
      InstagramEmbed,
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
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[400px] p-6',
      },
    },
  });

  const addLink = useCallback(() => {
    if (linkUrl && editor) {
      editor.chain().focus().setLink({ href: linkUrl }).run();
      setLinkUrl('');
      setShowLinkDialog(false);
    }
  }, [editor, linkUrl]);

  const addImage = useCallback(() => {
    if (imageUrl && editor) {
      if (editor.isActive('image')) {
        // Mevcut görseli güncelle
        editor.chain().focus().updateAttributes('image', {
          src: imageUrl,
          alt: imageAlt || 'Görsel'
        }).run();
      } else {
        // Yeni görsel ekle
        editor.chain().focus().setImage({ 
          src: imageUrl,
          alt: imageAlt || 'Görsel'
        }).run();
      }
      setImageUrl('');
      setImageAlt('');
      setShowImageDialog(false);
    }
  }, [editor, imageUrl, imageAlt]);

  const addYoutube = useCallback(() => {
    if (youtubeUrl && editor) {
      editor.chain().focus().setYoutubeVideo({ src: youtubeUrl }).run();
      setYoutubeUrl('');
      setShowYoutubeDialog(false);
    }
  }, [editor, youtubeUrl]);

  const addTwitter = useCallback(() => {
    if (twitterUrl && editor) {
      const tweetId = twitterUrl.split('/').pop()?.split('?')[0];
      if (tweetId) {
        const embedHtml = `<blockquote class="twitter-tweet" data-tweet-id="${tweetId}"><a href="${twitterUrl}">Tweet</a></blockquote>`;
        editor.chain().focus().insertContent(embedHtml).run();
      }
      setTwitterUrl('');
      setShowTwitterDialog(false);
    }
  }, [editor, twitterUrl]);

  const addInstagram = useCallback(() => {
    if (instagramUrl && editor) {
      const embedHtml = `<blockquote class="instagram-media" data-instgrm-permalink="${instagramUrl}"><a href="${instagramUrl}">Instagram</a></blockquote>`;
      editor.chain().focus().insertContent(embedHtml).run();
      setInstagramUrl('');
      setShowInstagramDialog(false);
    }
  }, [editor, instagramUrl]);

  if (!editor) {
    return null;
  }

  const MenuButton = ({ onClick, isActive, disabled, children, title }: any) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`p-2 rounded hover:bg-gray-100 transition-colors ${
        isActive ? 'bg-blue-100 text-blue-600' : 'text-gray-700'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      title={title}
    >
      {children}
    </button>
  );

  return (
    <div className={`border border-gray-300 rounded-lg bg-white shadow-sm ${className}`}>
      {/* Main Toolbar */}
      <div className="border-b border-gray-200 p-3 flex flex-wrap items-center gap-1 bg-gray-50 sticky top-0 z-10">
        {/* Text Formatting */}
        <div className="flex items-center gap-1 pr-2 border-r border-gray-300">
          <MenuButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            title="Kalın (Ctrl+B)"
          >
            <Bold className="w-4 h-4" />
          </MenuButton>
          
          <MenuButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            title="İtalik (Ctrl+I)"
          >
            <Italic className="w-4 h-4" />
          </MenuButton>
          
          <MenuButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive('underline')}
            title="Altı Çizili (Ctrl+U)"
          >
            <UnderlineIcon className="w-4 h-4" />
          </MenuButton>

          <MenuButton
            onClick={() => editor.chain().focus().toggleCode().run()}
            isActive={editor.isActive('code')}
            title="Kod"
          >
            <Code className="w-4 h-4" />
          </MenuButton>
        </div>

        {/* Headings */}
        <div className="flex items-center gap-1 pr-2 border-r border-gray-300">
          <MenuButton
            onClick={() => editor.chain().focus().setParagraph().run()}
            isActive={editor.isActive('paragraph')}
            title="Normal Metin"
          >
            <Type className="w-4 h-4" />
          </MenuButton>
          
          <MenuButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            isActive={editor.isActive('heading', { level: 1 })}
            title="Başlık 1"
          >
            <Heading1 className="w-4 h-4" />
          </MenuButton>
          
          <MenuButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive('heading', { level: 2 })}
            title="Başlık 2"
          >
            <Heading2 className="w-4 h-4" />
          </MenuButton>
          
          <MenuButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            isActive={editor.isActive('heading', { level: 3 })}
            title="Başlık 3"
          >
            <Heading3 className="w-4 h-4" />
          </MenuButton>
        </div>

        {/* Lists */}
        <div className="flex items-center gap-1 pr-2 border-r border-gray-300">
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

          <MenuButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive('blockquote')}
            title="Alıntı"
          >
            <Quote className="w-4 h-4" />
          </MenuButton>
        </div>

        {/* Alignment */}
        <div className="flex items-center gap-1 pr-2 border-r border-gray-300">
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
            title="İki Yana Yasla"
          >
            <AlignJustify className="w-4 h-4" />
          </MenuButton>
        </div>

        {/* Media */}
        <div className="flex items-center gap-1 pr-2 border-r border-gray-300">
          <MenuButton
            onClick={() => setShowLinkDialog(true)}
            isActive={editor.isActive('link')}
            title="Bağlantı Ekle"
          >
            <LinkIcon className="w-4 h-4" />
          </MenuButton>

          <MenuButton
            onClick={() => {
              // Eğer görsel seçiliyse, mevcut değerleri doldur
              if (editor.isActive('image')) {
                const attrs = editor.getAttributes('image');
                setImageUrl(attrs.src || '');
                setImageAlt(attrs.alt || '');
              }
              setShowImageDialog(true);
            }}
            isActive={editor.isActive('image')}
            title={editor.isActive('image') ? 'Görseli Düzenle' : 'Görsel Ekle'}
          >
            {editor.isActive('image') ? <Edit2 className="w-4 h-4" /> : <ImagePlus className="w-4 h-4" />}
          </MenuButton>

          {editor.isActive('image') && (
            <MenuButton
              onClick={() => editor.chain().focus().deleteSelection().run()}
              title="Görseli Sil"
            >
              <Trash2 className="w-4 h-4 text-red-600" />
            </MenuButton>
          )}

          <MenuButton
            onClick={() => setShowYoutubeDialog(true)}
            title="YouTube Video Ekle"
          >
            <YoutubeIcon className="w-4 h-4" />
          </MenuButton>

          <MenuButton
            onClick={() => setShowTwitterDialog(true)}
            title="Tweet Ekle"
          >
            <Twitter className="w-4 h-4" />
          </MenuButton>

          <MenuButton
            onClick={() => setShowInstagramDialog(true)}
            title="Instagram Gönderisi Ekle"
          >
            <Instagram className="w-4 h-4" />
          </MenuButton>
        </div>

        {/* Horizontal Rule */}
        <div className="flex items-center gap-1 pr-2 border-r border-gray-300">
          <MenuButton
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="Yatay Çizgi"
          >
            <Minus className="w-4 h-4" />
          </MenuButton>
        </div>

        {/* Undo/Redo */}
        <div className="flex items-center gap-1">
          <MenuButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Geri Al (Ctrl+Z)"
          >
            <Undo className="w-4 h-4" />
          </MenuButton>
          
          <MenuButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Yinele (Ctrl+Y)"
          >
            <Redo className="w-4 h-4" />
          </MenuButton>
        </div>
      </div>

      {/* Dialogs */}
      {showLinkDialog && (
        <Dialog
          title="Bağlantı Ekle"
          onClose={() => setShowLinkDialog(false)}
        >
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://example.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && addLink()}
          />
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => setShowLinkDialog(false)}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              İptal
            </button>
            <button
              onClick={addLink}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Ekle
            </button>
          </div>
        </Dialog>
      )}

      {showImageDialog && (
        <Dialog
          title={editor.isActive('image') ? 'Görseli Düzenle' : 'Görsel Ekle'}
          onClose={() => {
            setShowImageDialog(false);
            setImageUrl('');
            setImageAlt('');
          }}
        >
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Görsel URL</label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="/uploads/image.jpg veya https://..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Alt Text (SEO)</label>
              <input
                type="text"
                value={imageAlt}
                onChange={(e) => setImageAlt(e.target.value)}
                placeholder="Görsel açıklaması..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            <div className="flex justify-end gap-2 mt-4">
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
                onClick={addImage}
                disabled={!imageUrl}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {editor.isActive('image') ? 'Güncelle' : 'Ekle'}
              </button>
            </div>
          </div>
        </Dialog>
      )}

      {showYoutubeDialog && (
        <Dialog
          title="YouTube Video Ekle"
          onClose={() => setShowYoutubeDialog(false)}
        >
          <input
            type="url"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && addYoutube()}
          />
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => setShowYoutubeDialog(false)}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              İptal
            </button>
            <button
              onClick={addYoutube}
              disabled={!youtubeUrl}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
            >
              Ekle
            </button>
          </div>
        </Dialog>
      )}

      {showTwitterDialog && (
        <Dialog
          title="Tweet Ekle"
          onClose={() => setShowTwitterDialog(false)}
        >
          <input
            type="url"
            value={twitterUrl}
            onChange={(e) => setTwitterUrl(e.target.value)}
            placeholder="https://twitter.com/username/status/..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && addTwitter()}
          />
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => setShowTwitterDialog(false)}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              İptal
            </button>
            <button
              onClick={addTwitter}
              disabled={!twitterUrl}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
            >
              Ekle
            </button>
          </div>
        </Dialog>
      )}

      {showInstagramDialog && (
        <Dialog
          title="Instagram Gönderisi Ekle"
          onClose={() => setShowInstagramDialog(false)}
        >
          <input
            type="url"
            value={instagramUrl}
            onChange={(e) => setInstagramUrl(e.target.value)}
            placeholder="https://www.instagram.com/p/..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && addInstagram()}
          />
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => setShowInstagramDialog(false)}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              İptal
            </button>
            <button
              onClick={addInstagram}
              disabled={!instagramUrl}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
            >
              Ekle
            </button>
          </div>
        </Dialog>
      )}

      {/* Editor Content */}
      <EditorContent 
        editor={editor} 
        className="min-h-[400px] max-h-[600px] overflow-y-auto"
      />

      {/* Character & Word Count */}
      <div className="border-t border-gray-200 px-4 py-2 text-xs text-gray-500 flex justify-between bg-gray-50">
        <span>✏️ {editor.storage.characterCount.characters()} karakter</span>
        <span>📝 {editor.storage.characterCount.words()} kelime</span>
      </div>
    </div>
  );
}

// Dialog Component
function Dialog({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

