'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered, 
  Link, 
  Image,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Palette,
  Type
} from 'lucide-react';

interface SimpleEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  height?: number;
}

export default function SimpleEditor({ 
  content, 
  onChange, 
  placeholder = 'İçeriğinizi buraya yazın...',
  height = 300 
}: SimpleEditorProps) {
  const [isPreview, setIsPreview] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const isFirstLoad = useRef(true);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<any[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sadece ilk yüklemede içeriği set et
  useEffect(() => {
    if (editorRef.current && !isPreview && isFirstLoad.current && content) {
      editorRef.current.innerHTML = content;
      isFirstLoad.current = false;
    }
  }, [content, isPreview]);

  const execCommand = (command: string, value?: string) => {
    if (editorRef.current) {
      editorRef.current.focus();
      
      // execCommand'ı kullan (hala çoğu tarayıcıda çalışıyor)
      const success = document.execCommand(command, false, value);
      
      if (success) {
        // Değişikliği kaydet
        setTimeout(() => {
          if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
          }
        }, 0);
      }
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const insertLink = () => {
    const url = prompt('Link URL\'si girin:');
    if (url) {
      execCommand('createLink', url);
    }
  };

  const insertImage = () => {
    setShowMediaPicker(true);
    fetchMedia();
  };

  const fetchMedia = async () => {
    setLoadingMedia(true);
    try {
      const res = await fetch('/api/media?limit=50');
      const data = await res.json();
      if (data.success) {
        setMediaFiles(data.data);
      }
    } catch (error) {
      console.error('Media fetch error:', error);
    } finally {
      setLoadingMedia(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await fetch('/api/media', {
        method: 'POST',
        body: formData
      });
      
      const data = await res.json();
      if (data.success) {
        insertImageUrl(data.data.file_path);
        fetchMedia();
      }
    } catch (error) {
      console.error('Image upload error:', error);
      alert('Resim yüklenemedi');
    } finally {
      setUploadingImage(false);
    }
  };

  const insertImageUrl = (url: string) => {
    execCommand('insertImage', url);
    setShowMediaPicker(false);
  };

  const togglePreview = () => {
    setIsPreview(!isPreview);
  };

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="bg-gray-50 border-b border-gray-300 p-2 flex flex-wrap items-center gap-1">
        {/* Text Formatting */}
        <div className="flex items-center gap-1 border-r border-gray-300 pr-2 mr-2">
          <button
            onClick={() => execCommand('bold')}
            className="p-2 hover:bg-gray-200 rounded transition-colors text-gray-700"
            title="Kalın"
          >
            <Bold size={16} />
          </button>
          <button
            onClick={() => execCommand('italic')}
            className="p-2 hover:bg-gray-200 rounded transition-colors text-gray-700"
            title="İtalik"
          >
            <Italic size={16} />
          </button>
          <button
            onClick={() => execCommand('underline')}
            className="p-2 hover:bg-gray-200 rounded transition-colors text-gray-700"
            title="Altı Çizili"
          >
            <Underline size={16} />
          </button>
        </div>

        {/* Lists */}
        <div className="flex items-center gap-1 border-r border-gray-300 pr-2 mr-2">
          <button
            onClick={() => execCommand('insertUnorderedList')}
            className="p-2 hover:bg-gray-200 rounded transition-colors text-gray-700"
            title="Madde İşareti"
          >
            <List size={16} />
          </button>
          <button
            onClick={() => execCommand('insertOrderedList')}
            className="p-2 hover:bg-gray-200 rounded transition-colors text-gray-700"
            title="Numaralı Liste"
          >
            <ListOrdered size={16} />
          </button>
        </div>

        {/* Alignment */}
        <div className="flex items-center gap-1 border-r border-gray-300 pr-2 mr-2">
          <button
            onClick={() => execCommand('justifyLeft')}
            className="p-2 hover:bg-gray-200 rounded transition-colors text-gray-700"
            title="Sola Hizala"
          >
            <AlignLeft size={16} />
          </button>
          <button
            onClick={() => execCommand('justifyCenter')}
            className="p-2 hover:bg-gray-200 rounded transition-colors text-gray-700"
            title="Ortala"
          >
            <AlignCenter size={16} />
          </button>
          <button
            onClick={() => execCommand('justifyRight')}
            className="p-2 hover:bg-gray-200 rounded transition-colors text-gray-700"
            title="Sağa Hizala"
          >
            <AlignRight size={16} />
          </button>
          <button
            onClick={() => execCommand('justifyFull')}
            className="p-2 hover:bg-gray-200 rounded transition-colors text-gray-700"
            title="İki Yana Hizala"
          >
            <AlignJustify size={16} />
          </button>
        </div>

        {/* Media */}
        <div className="flex items-center gap-1 border-r border-gray-300 pr-2 mr-2">
          <button
            onClick={insertLink}
            className="p-2 hover:bg-gray-200 rounded transition-colors text-gray-700"
            title="Link Ekle"
          >
            <Link size={16} />
          </button>
          <button
            onClick={insertImage}
            className="p-2 hover:bg-gray-200 rounded transition-colors text-gray-700"
            title="Resim Ekle"
          >
            <Image size={16} />
          </button>
        </div>

        {/* Font Size */}
        <div className="flex items-center gap-1 border-r border-gray-300 pr-2 mr-2">
          <select
            onChange={(e) => execCommand('fontSize', e.target.value)}
            className="px-2 py-1 border border-gray-300 rounded text-sm text-gray-700"
            title="Font Boyutu"
          >
            <option value="">Boyut</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
            <option value="6">6</option>
            <option value="7">7</option>
          </select>
        </div>

        {/* Preview */}
        <div className="flex items-center gap-1 ml-auto">
          <button
            onClick={togglePreview}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              isPreview 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
            title="Önizleme"
          >
            <Type size={14} className="inline mr-1" />
            {isPreview ? 'Düzenle' : 'Önizleme'}
          </button>
        </div>
      </div>

      {/* Editor Content */}
      <div style={{ height: `${height}px` }}>
        {isPreview ? (
          <div 
            className="p-4 overflow-auto h-full bg-gray-50"
            dangerouslySetInnerHTML={{ __html: content || '<p>Önizleme içeriği...</p>' }}
          />
        ) : (
          <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            onKeyDown={(e) => {
              // Enter tuşu ile satır başı
              if (e.key === 'Enter') {
                // execCommand'ın insertParagraph komutunu kullan
                execCommand('insertParagraph');
                e.preventDefault();
              }
            }}
            className="p-4 overflow-auto h-full focus:outline-none simple-editor-content text-gray-900"
            style={{ 
              minHeight: `${height - 8}px`,
              lineHeight: '1.5',
              fontSize: '14px',
              fontFamily: 'system-ui, -apple-system, sans-serif'
            }}
            data-placeholder={placeholder}
            suppressContentEditableWarning={true}
          />
        )}
      </div>

      {/* Placeholder */}
      {!content && !isPreview && (
        <div 
          className="absolute top-16 left-4 text-gray-400 pointer-events-none"
          style={{ top: `${height / 2 + 16}px` }}
        >
          {placeholder}
        </div>
      )}

      {/* Media Picker Modal */}
      {showMediaPicker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Medya Seç veya Yükle</h3>
              <button
                onClick={() => setShowMediaPicker(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {/* Upload Section */}
            <div className="mb-6">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file);
                }}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                className="w-full border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                {uploadingImage ? (
                  <span>Yükleniyor...</span>
                ) : (
                  <>
                    <div className="text-center">
                      <Image size={48} className="mx-auto mb-2 text-gray-400" />
                      <p className="text-gray-600">Resim yüklemek için tıklayın</p>
                    </div>
                  </>
                )}
              </button>
            </div>

            {/* Media Grid */}
            {loadingMedia ? (
              <div className="text-center py-8">Yükleniyor...</div>
            ) : mediaFiles.length === 0 ? (
              <div className="text-center py-8 text-gray-500">Henüz medya yok</div>
            ) : (
              <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                {mediaFiles.map((media) => (
                  <div
                    key={media.id}
                    className="border border-gray-200 rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => insertImageUrl(media.file_path)}
                  >
                    <div className="relative aspect-square bg-gray-100">
                      <img
                        src={media.file_path}
                        alt={media.alt_text || media.file_name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-2">
                      <p className="text-xs truncate">{media.file_name}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
