'use client';

import { useState, useRef, useEffect } from 'react';
import { Plus, Image, Video, Link2, Type, Bold, Italic, List, Quote, Upload } from 'lucide-react';

interface Block {
  id: string;
  type: 'paragraph' | 'heading1' | 'heading2' | 'heading3' | 'image' | 'youtube' | 'instagram' | 'twitter' | 'quote' | 'list';
  content: string;
  level?: number; // for headings
  items?: string[]; // for lists
}

interface FrontendEditorProps {
  content: string;
  onChange: (content: string) => void;
}

export default function FrontendEditor({ content, onChange }: FrontendEditorProps) {
  console.log('🚀 FrontendEditor mounted with content:', content);
  
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [showBlockMenu, setShowBlockMenu] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [uploadingImages, setUploadingImages] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  // HTML'i bloklara çevir
  const parseHtmlToBlocks = (html: string): Block[] => {
    if (!html) return [{ id: '1', type: 'paragraph', content: '' }];

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const elements = Array.from(doc.body.children);
    
    const parsedBlocks: Block[] = [];
    let idCounter = 1;

    elements.forEach((element) => {
      const tagName = element.tagName.toLowerCase();
      const text = element.textContent?.trim() || '';
      const innerHTML = element.innerHTML;

      if (!text && !innerHTML) return;

      switch (tagName) {
        case 'h1':
          parsedBlocks.push({
            id: idCounter.toString(),
            type: 'heading1',
            content: text,
            level: 1
          });
          idCounter++;
          break;
        case 'h2':
          parsedBlocks.push({
            id: idCounter.toString(),
            type: 'heading2',
            content: text,
            level: 2
          });
          idCounter++;
          break;
        case 'h3':
          parsedBlocks.push({
            id: idCounter.toString(),
            type: 'heading3',
            content: text,
            level: 3
          });
          idCounter++;
          break;
        case 'p':
          // Sadece img tag'i içeren p'leri atla
          const hasOnlyImage = element.querySelector('img') && element.textContent?.trim() === '';
          if (!hasOnlyImage) {
            parsedBlocks.push({
              id: idCounter.toString(),
              type: 'paragraph',
              content: innerHTML
            });
            idCounter++;
          }
          break;
        case 'ul':
          const listItems = Array.from(element.querySelectorAll('li')).map(li => li.innerHTML);
          parsedBlocks.push({
            id: idCounter.toString(),
            type: 'list',
            content: '',
            items: listItems
          });
          idCounter++;
          break;
        case 'blockquote':
          parsedBlocks.push({
            id: idCounter.toString(),
            type: 'quote',
            content: text
          });
          idCounter++;
          break;
        case 'img':
          parsedBlocks.push({
            id: idCounter.toString(),
            type: 'image',
            content: element.getAttribute('src') || ''
          });
          idCounter++;
          break;
        case 'figure':
          // Figure içindeki img'i al
          const img = element.querySelector('img');
          if (img) {
            parsedBlocks.push({
              id: idCounter.toString(),
              type: 'image',
              content: img.getAttribute('src') || ''
            });
            idCounter++;
          }
          break;
        default:
          // Diğer elementler için paragraph
          if (innerHTML && innerHTML.length > 0 && tagName !== 'figcaption') {
            parsedBlocks.push({
              id: idCounter.toString(),
              type: 'paragraph',
              content: innerHTML
            });
            idCounter++;
          }
      }
    });

    return parsedBlocks.length > 0 ? parsedBlocks : [{ id: '1', type: 'paragraph', content: '' }];
  };

  // Blokları HTML'e çevir
  const blocksToHtml = (blocks: Block[]): string => {
    return blocks.map(block => {
      switch (block.type) {
        case 'heading1':
          return `<h1>${block.content}</h1>`;
        case 'heading2':
          return `<h2>${block.content}</h2>`;
        case 'heading3':
          return `<h3>${block.content}</h3>`;
        case 'paragraph':
          return `<p>${block.content}</p>`;
        case 'image':
          return `<img src="${block.content}" alt="" style="max-width: 100%; height: auto;" />`;
        case 'youtube':
          return `<iframe width="560" height="315" src="${block.content}" frameborder="0" allowfullscreen></iframe>`;
        case 'instagram':
          return `<iframe src="${block.content}" width="100%" height="400" frameborder="0"></iframe>`;
        case 'twitter':
          return `<iframe src="${block.content}" width="100%" height="400" frameborder="0"></iframe>`;
        case 'quote':
          return `<blockquote>${block.content}</blockquote>`;
        case 'list':
          const listItems = block.items?.map(item => `<li>${item}</li>`).join('') || '';
          return `<ul>${listItems}</ul>`;
        default:
          return `<p>${block.content}</p>`;
      }
    }).join('');
  };

  // İlk yüklemede HTML'i parse et
  useEffect(() => {
    console.log('📄 Parsing HTML to blocks:', content);
    const parsedBlocks = parseHtmlToBlocks(content);
    console.log('📄 Parsed blocks:', parsedBlocks);
    setBlocks(parsedBlocks);
    setIsInitialized(true);
  }, []);

  // Bloklar değiştiğinde HTML'i güncelle (debounce ile)
  useEffect(() => {
    // İlk yüklemede onChange çağırma
    if (!isInitialized) return;

    // Önceki timer'ı temizle
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // 1 saniye sonra onChange çağır
    debounceTimer.current = setTimeout(() => {
      const html = blocksToHtml(blocks);
      console.log('🔄 Blocks changed (debounced), updating HTML:', html);
      onChange(html);
    }, 1000);

    // Cleanup
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [blocks, isInitialized]);

  // Yeni blok ekle
  const addBlock = (type: Block['type'], afterId?: string) => {
    const newBlock: Block = {
      id: Date.now().toString(),
      type,
      content: '',
      items: type === 'list' ? [''] : undefined
    };

    if (afterId) {
      const index = blocks.findIndex(b => b.id === afterId);
      const newBlocks = [...blocks];
      newBlocks.splice(index + 1, 0, newBlock);
      setBlocks(newBlocks);
      setActiveBlockId(newBlock.id);
    } else {
      setBlocks([...blocks, newBlock]);
      setActiveBlockId(newBlock.id);
    }
    setShowBlockMenu(null);
  };

  // Blok güncelle
  const updateBlock = (id: string, updates: Partial<Block>) => {
    setBlocks(blocks.map(block => 
      block.id === id ? { ...block, ...updates } : block
    ));
  };

  // Blok sil
  const deleteBlock = (id: string) => {
    if (blocks.length > 1) {
      setBlocks(blocks.filter(block => block.id !== id));
      setActiveBlockId(null);
    }
  };

  // Resim yükle
  const uploadImage = async (blockId: string, file: File) => {
    try {
      setUploadingImages(prev => new Set(prev).add(blockId));
      console.log('📤 Uploading image:', file.name);

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      console.log('✅ Image uploaded:', data.url);
      
      updateBlock(blockId, { content: data.url });
      setUploadingImages(prev => {
        const newSet = new Set(prev);
        newSet.delete(blockId);
        return newSet;
      });
    } catch (error) {
      console.error('❌ Upload error:', error);
      alert('Resim yüklenemedi. Lütfen tekrar deneyin.');
      setUploadingImages(prev => {
        const newSet = new Set(prev);
        newSet.delete(blockId);
        return newSet;
      });
    }
  };

  // Blok render et
  const renderBlock = (block: Block) => {
    const isActive = activeBlockId === block.id;
    const isMenuOpen = showBlockMenu === block.id;

    return (
      <div
        key={block.id}
        className={`relative group ${isActive ? 'ring-2 ring-blue-500 rounded-lg bg-blue-50' : 'hover:bg-gray-50'} p-2 mb-4 rounded-lg transition-all duration-200`}
        onClick={(e) => {
          e.stopPropagation();
          setActiveBlockId(block.id);
        }}
      >
        {/* Blok Menüsü */}
        <div className="absolute -left-12 top-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('➕ Opening block menu for:', block.id);
              setShowBlockMenu(isMenuOpen ? null : block.id);
            }}
            className="w-8 h-8 bg-gray-600 text-white rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors"
          >
            <Plus size={16} />
          </button>
          
          {/* Blok Tipi Menüsü */}
          {isMenuOpen && (
            <div className="absolute left-10 top-0 bg-white border border-gray-300 rounded-lg shadow-xl p-3 min-w-[280px] z-50">
              <div className="text-xs font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-200">
                📝 Yeni Blok Ekle
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    addBlock('paragraph', block.id);
                  }} 
                  className="flex items-center gap-2 p-2 hover:bg-blue-50 hover:text-blue-600 rounded text-sm transition-colors"
                >
                  <Type size={14} /> Paragraf
                </button>
                <button 
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    addBlock('heading1', block.id);
                  }} 
                  className="flex items-center gap-2 p-2 hover:bg-blue-50 hover:text-blue-600 rounded text-sm transition-colors"
                >
                  <Bold size={14} /> Başlık 1
                </button>
                <button 
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    addBlock('heading2', block.id);
                  }} 
                  className="flex items-center gap-2 p-2 hover:bg-blue-50 hover:text-blue-600 rounded text-sm transition-colors"
                >
                  <Bold size={14} /> Başlık 2
                </button>
                <button 
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    addBlock('heading3', block.id);
                  }} 
                  className="flex items-center gap-2 p-2 hover:bg-blue-50 hover:text-blue-600 rounded text-sm transition-colors"
                >
                  <Bold size={14} /> Başlık 3
                </button>
                <button 
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    addBlock('image', block.id);
                  }} 
                  className="flex items-center gap-2 p-2 hover:bg-blue-50 hover:text-blue-600 rounded text-sm transition-colors"
                >
                  <Image size={14} /> Resim
                </button>
                <button 
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    addBlock('youtube', block.id);
                  }} 
                  className="flex items-center gap-2 p-2 hover:bg-blue-50 hover:text-blue-600 rounded text-sm transition-colors"
                >
                  <Video size={14} /> YouTube
                </button>
                <button 
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    addBlock('instagram', block.id);
                  }} 
                  className="flex items-center gap-2 p-2 hover:bg-blue-50 hover:text-blue-600 rounded text-sm transition-colors"
                >
                  <Image size={14} /> Instagram
                </button>
                <button 
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    addBlock('twitter', block.id);
                  }} 
                  className="flex items-center gap-2 p-2 hover:bg-blue-50 hover:text-blue-600 rounded text-sm transition-colors"
                >
                  <Link2 size={14} /> Twitter
                </button>
                <button 
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    addBlock('quote', block.id);
                  }} 
                  className="flex items-center gap-2 p-2 hover:bg-blue-50 hover:text-blue-600 rounded text-sm transition-colors"
                >
                  <Quote size={14} /> Alıntı
                </button>
                <button 
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    addBlock('list', block.id);
                  }} 
                  className="flex items-center gap-2 p-2 hover:bg-blue-50 hover:text-blue-600 rounded text-sm transition-colors"
                >
                  <List size={14} /> Liste
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Blok İçeriği */}
        <div className="min-h-[40px]">
          {block.type === 'paragraph' && (
            <div className="relative group">
              {/* Inline Toolbar */}
              {isActive && (
                <div className="absolute -top-12 left-0 bg-gray-800 text-white rounded-lg p-1 flex items-center gap-1 z-10">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      document.execCommand('bold');
                      const newContent = document.getSelection()?.focusNode?.parentElement?.innerHTML || '';
                      updateBlock(block.id, { content: newContent });
                    }}
                    className="p-1 hover:bg-gray-700 rounded"
                    title="Kalın"
                  >
                    <Bold size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      document.execCommand('italic');
                      const newContent = document.getSelection()?.focusNode?.parentElement?.innerHTML || '';
                      updateBlock(block.id, { content: newContent });
                    }}
                    className="p-1 hover:bg-gray-700 rounded"
                    title="İtalik"
                  >
                    <Italic size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      document.execCommand('underline');
                      const newContent = document.getSelection()?.focusNode?.parentElement?.innerHTML || '';
                      updateBlock(block.id, { content: newContent });
                    }}
                    className="p-1 hover:bg-gray-700 rounded"
                    title="Altı Çizili"
                  >
                    <span className="underline text-sm">U</span>
                  </button>
                </div>
              )}
              <div
                contentEditable
                suppressContentEditableWarning
                onInput={(e) => updateBlock(block.id, { content: e.currentTarget.innerHTML })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    addBlock('paragraph', block.id);
                  }
                }}
                onClick={(e) => e.stopPropagation()}
                className="outline-none"
                dangerouslySetInnerHTML={{ __html: block.content || '<br>' }}
              />
            </div>
          )}

          {block.type === 'heading1' && (
            <h1
              contentEditable
              suppressContentEditableWarning
              onInput={(e) => updateBlock(block.id, { content: e.currentTarget.textContent || '' })}
              onClick={(e) => e.stopPropagation()}
              className="text-4xl font-bold text-gray-900 leading-tight outline-none"
              style={{ fontFamily: 'var(--font-lora)' }}
            >
              {block.content || 'Başlık 1'}
            </h1>
          )}

          {block.type === 'heading2' && (
            <h2
              contentEditable
              suppressContentEditableWarning
              onInput={(e) => updateBlock(block.id, { content: e.currentTarget.textContent || '' })}
              onClick={(e) => e.stopPropagation()}
              className="text-3xl font-bold text-gray-900 leading-tight outline-none"
              style={{ fontFamily: 'var(--font-lora)' }}
            >
              {block.content || 'Başlık 2'}
            </h2>
          )}

          {block.type === 'heading3' && (
            <h3
              contentEditable
              suppressContentEditableWarning
              onInput={(e) => updateBlock(block.id, { content: e.currentTarget.textContent || '' })}
              onClick={(e) => e.stopPropagation()}
              className="text-2xl font-semibold text-gray-900 leading-tight outline-none"
              style={{ fontFamily: 'var(--font-lora)' }}
            >
              {block.content || 'Başlık 3'}
            </h3>
          )}

          {block.type === 'image' && (
            <div className="relative group">
              {uploadingImages.has(block.id) ? (
                <div className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center bg-blue-50">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-sm text-blue-600">Resim yükleniyor...</p>
                </div>
              ) : block.content ? (
                <div className="relative">
                  <img 
                    src={block.content} 
                    alt="" 
                    className="max-w-full h-auto rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('🗑️ Deleting image block:', block.id);
                      deleteBlock(block.id);
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    title="Resmi Sil"
                  >
                    ×
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('✏️ Changing image:', block.id);
                      fileInputRefs.current[block.id]?.click();
                    }}
                    className="absolute top-2 left-2 bg-blue-500 text-white rounded px-3 py-1 text-sm hover:bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg flex items-center gap-1"
                    title="Resmi Değiştir"
                  >
                    <Upload size={14} /> Değiştir
                  </button>
                  <input
                    ref={(el) => (fileInputRefs.current[block.id] = el)}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadImage(block.id, file);
                    }}
                  />
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
                  <input
                    ref={(el) => (fileInputRefs.current[block.id] = el)}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadImage(block.id, file);
                    }}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      fileInputRefs.current[block.id]?.click();
                    }}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors inline-flex items-center gap-2"
                  >
                    <Upload size={16} /> Resim Yükle
                  </button>
                  <p className="text-xs text-gray-500 mt-3">veya</p>
                  <input
                    type="url"
                    placeholder="Resim URL'si girin..."
                    className="w-full p-2 border border-gray-300 rounded mt-2"
                    onBlur={(e) => {
                      if (e.target.value) updateBlock(block.id, { content: e.target.value });
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              )}
            </div>
          )}

          {block.type === 'youtube' && (
            <div className="relative group">
              {block.content ? (
                <div className="relative">
                  <iframe 
                    width="560" 
                    height="315" 
                    src={block.content} 
                    frameBorder="0" 
                    allowFullScreen
                    className="max-w-full rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('🗑️ Deleting YouTube block:', block.id);
                      deleteBlock(block.id);
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    title="YouTube'u Sil"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <input
                    type="url"
                    placeholder="YouTube embed URL'si girin..."
                    className="w-full p-2 border border-gray-300 rounded"
                    onBlur={(e) => updateBlock(block.id, { content: e.target.value })}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              )}
            </div>
          )}

          {block.type === 'instagram' && (
            <div className="relative group">
              {block.content ? (
                <div className="relative">
                  <iframe 
                    src={block.content} 
                    width="100%" 
                    height="400" 
                    frameBorder="0"
                    className="rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('🗑️ Deleting Instagram block:', block.id);
                      deleteBlock(block.id);
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    title="Instagram'ı Sil"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <input
                    type="url"
                    placeholder="Instagram embed URL'si girin..."
                    className="w-full p-2 border border-gray-300 rounded"
                    onBlur={(e) => updateBlock(block.id, { content: e.target.value })}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              )}
            </div>
          )}

          {block.type === 'twitter' && (
            <div className="relative group">
              {block.content ? (
                <div className="relative">
                  <iframe 
                    src={block.content} 
                    width="100%" 
                    height="400" 
                    frameBorder="0"
                    className="rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('🗑️ Deleting Twitter block:', block.id);
                      deleteBlock(block.id);
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    title="Twitter'ı Sil"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <input
                    type="url"
                    placeholder="Twitter embed URL'si girin..."
                    className="w-full p-2 border border-gray-300 rounded"
                    onBlur={(e) => updateBlock(block.id, { content: e.target.value })}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              )}
            </div>
          )}

          {block.type === 'quote' && (
            <blockquote
              contentEditable
              suppressContentEditableWarning
              onInput={(e) => updateBlock(block.id, { content: e.currentTarget.textContent || '' })}
              onClick={(e) => e.stopPropagation()}
              className="border-l-4 border-gray-300 pl-4 italic text-gray-700 outline-none"
            >
              {block.content || 'Alıntı metni...'}
            </blockquote>
          )}

          {block.type === 'list' && (
            <ul className="list-disc pl-6" onClick={(e) => e.stopPropagation()}>
              {block.items?.map((item, index) => (
                <li
                  key={index}
                  contentEditable
                  suppressContentEditableWarning
                  onInput={(e) => {
                    const newItems = [...(block.items || [])];
                    newItems[index] = e.currentTarget.textContent || '';
                    updateBlock(block.id, { items: newItems });
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="outline-none"
                >
                  {item || 'Liste öğesi...'}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Silme Butonu - Her zaman görünür */}
        {blocks.length > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('🗑️ Deleting block:', block.id);
              deleteBlock(block.id);
            }}
            className="absolute -right-12 top-0 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-all shadow-lg opacity-0 group-hover:opacity-100"
            title="Bloğu Sil"
          >
            ×
          </button>
        )}
      </div>
    );
  };

  return (
    <div 
      ref={containerRef}
      className="max-w-[680px] mx-auto"
      onClick={() => {
        setActiveBlockId(null);
        setShowBlockMenu(null);
      }}
    >
      {/* Frontend benzeri render */}
      <div className="frontend-editor">
        {blocks.map(renderBlock)}
      </div>

      {/* İlk blok ekleme butonu */}
      {blocks.length === 0 && (
        <div className="text-center py-8">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              addBlock('paragraph');
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            İçerik eklemeye başlayın
          </button>
        </div>
      )}
    </div>
  );
}
