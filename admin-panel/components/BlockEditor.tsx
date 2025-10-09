'use client';

import { useEffect, useRef, useState } from 'react';
import { Maximize2, Minimize2, Eye, Code } from 'lucide-react';

interface BlockEditorProps {
  content: string;
  onChange: (content: string) => void;
}

export default function BlockEditor({ content, onChange }: BlockEditorProps) {
  console.log('🚀 BlockEditor component mounted!');
  
  const editorRef = useRef<any>(null);
  const holderRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [editorInstance, setEditorInstance] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (typeof window !== 'undefined' && holderRef.current && !editorInstance) {
      console.log('Initializing Editor.js...');
      initEditor();
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (editorInstance?.destroy) {
        editorInstance.destroy();
      }
    };
  }, []);

  // Debug: content değişikliklerini logla
  useEffect(() => {
    console.log('Content changed:', content);
  }, [content]);

  const initEditor = async () => {
    const EditorJS = (await import('@editorjs/editorjs')).default;
    const Header = (await import('@editorjs/header')).default;
    const List = (await import('@editorjs/list')).default;
    const Paragraph = (await import('@editorjs/paragraph')).default;
    const Image = (await import('@editorjs/image')).default;
    const Quote = (await import('@editorjs/quote')).default;
    const Embed = (await import('@editorjs/embed')).default;
    const Delimiter = (await import('@editorjs/delimiter')).default;
    const Table = (await import('@editorjs/table')).default;
    const RawTool = (await import('@editorjs/raw')).default;
    const InlineCode = (await import('@editorjs/inline-code')).default;

    let initialData;
    
    // Content formatını kontrol et
    if (!content) {
      initialData = { time: Date.now(), blocks: [] };
    } else if (content.startsWith('{')) {
      // JSON formatında
      try {
        initialData = JSON.parse(content);
      } catch (e) {
        console.error('JSON parse error:', e);
        initialData = { time: Date.now(), blocks: [] };
      }
    } else {
      // HTML formatında - Editor.js formatına çevir
      console.log('HTML content detected, converting to Editor.js format');
      initialData = convertHtmlToEditorJs(content);
    }

    try {
      console.log('Editor.js initializing with data:', initialData);
      
      const editor = new EditorJS({
        holder: holderRef.current!,
        data: initialData,
        placeholder: 'Yazmaya başlayın veya / yazarak blok ekleyin...',
      tools: {
        header: {
          class: Header,
          config: {
            levels: [1, 2, 3],
            defaultLevel: 2
          },
          inlineToolbar: true
        },
        paragraph: {
          class: Paragraph,
          inlineToolbar: true
        },
        list: {
          class: List,
          inlineToolbar: true,
          config: {
            defaultStyle: 'unordered'
          }
        },
        image: {
          class: Image,
          config: {
            uploader: {
              uploadByFile: async (file: File) => {
                // Buraya dosya yükleme API'si eklenebilir
                return {
                  success: 1,
                  file: {
                    url: '/uploads/' + file.name
                  }
                };
              },
              uploadByUrl: async (url: string) => {
                return {
                  success: 1,
                  file: {
                    url: url
                  }
                };
              }
            }
          }
        },
        quote: {
          class: Quote,
          inlineToolbar: true,
          config: {
            quotePlaceholder: 'Alıntı metni',
            captionPlaceholder: 'Alıntı yazarı'
          }
        },
        embed: {
          class: Embed,
          config: {
            services: {
              youtube: true,
              twitter: true,
              instagram: true,
              vimeo: true,
              coub: true,
              codepen: true
            }
          }
        },
        delimiter: Delimiter,
        table: {
          class: Table,
          inlineToolbar: true
        },
        raw: RawTool,
        inlineCode: {
          class: InlineCode,
          shortcut: 'CMD+SHIFT+C'
        }
      },
      onChange: async (api) => {
        // Sadece görsel geri bildirim, onChange hemen çağrılmıyor
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }
        
        setIsSaving(true);
        
        // 1.5 saniye sonra state'e kaydet (sadece local)
        saveTimeoutRef.current = setTimeout(async () => {
          try {
            const savedData = await api.saver.save();
            onChange(JSON.stringify(savedData));
            setIsSaving(false);
          } catch (error) {
            console.error('Editor save error:', error);
            setIsSaving(false);
          }
        }, 1500);
      },
      onReady: () => {
        console.log('Editor.js is ready!');
      }
    });

      setEditorInstance(editor);
    } catch (error) {
      console.error('Editor.js initialization error:', error);
      // Fallback: Boş editör başlat
      const fallbackEditor = new EditorJS({
        holder: holderRef.current!,
        data: { time: Date.now(), blocks: [] },
        placeholder: 'Yazmaya başlayın...',
      });
      setEditorInstance(fallbackEditor);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const convertHtmlToEditorJs = (html: string) => {
    if (!html) return { time: Date.now(), blocks: [] };

    console.log('Converting HTML to Editor.js format:', html);
    
    const blocks: any[] = [];
    
    try {
      // HTML'i parse et
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // Her element için blok oluştur
      const processElement = (element: Element) => {
        const tagName = element.tagName.toLowerCase();
        const text = element.textContent?.trim() || '';
        const innerHTML = element.innerHTML;
        
        if (!text && !innerHTML) return;
        
        switch (tagName) {
          case 'h1':
            blocks.push({
              type: 'header',
              data: { level: 1, text: text }
            });
            break;
          case 'h2':
            blocks.push({
              type: 'header',
              data: { level: 2, text: text }
            });
            break;
          case 'h3':
            blocks.push({
              type: 'header',
              data: { level: 3, text: text }
            });
            break;
          case 'p':
            if (innerHTML) {
              blocks.push({
                type: 'paragraph',
                data: { text: innerHTML }
              });
            }
            break;
          case 'ul':
            const listItems = Array.from(element.querySelectorAll('li')).map(li => li.innerHTML);
            if (listItems.length > 0) {
              blocks.push({
                type: 'list',
                data: { style: 'unordered', items: listItems }
              });
            }
            break;
          case 'ol':
            const orderedItems = Array.from(element.querySelectorAll('li')).map(li => li.innerHTML);
            if (orderedItems.length > 0) {
              blocks.push({
                type: 'list',
                data: { style: 'ordered', items: orderedItems }
              });
            }
            break;
          case 'blockquote':
            blocks.push({
              type: 'quote',
              data: { text: text, caption: '' }
            });
            break;
          case 'img':
            blocks.push({
              type: 'image',
              data: {
                file: { url: element.getAttribute('src') || '' },
                caption: element.getAttribute('alt') || ''
              }
            });
            break;
          default:
            // Diğer elementler için paragraph olarak ekle
            if (innerHTML && innerHTML.length > 0) {
              blocks.push({
                type: 'paragraph',
                data: { text: innerHTML }
              });
            }
        }
      };
      
      // Tüm child elementleri işle
      Array.from(doc.body.children).forEach(processElement);
      
      console.log('Converted blocks:', blocks);
      
      return {
        time: Date.now(),
        blocks: blocks.length > 0 ? blocks : [{
          type: 'paragraph',
          data: { text: html }
        }]
      };
    } catch (error) {
      console.error('HTML conversion error:', error);
      return {
        time: Date.now(),
        blocks: [{
          type: 'paragraph',
          data: { text: html }
        }]
      };
    }
  };

  const renderPreview = () => {
    try {
      console.log('🔍 renderPreview called with content:', content);
      console.log('🔍 Content type:', typeof content);
      console.log('🔍 Content starts with {:', content?.startsWith?.('{'));
      
      // Eğer content HTML ise direkt göster
      if (content && !content.startsWith('{')) {
        console.log('✅ Rendering HTML content directly:', content);
        return (
          <div 
            className="max-w-none font-sans text-gray-900 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: content }}
            style={{
              fontFamily: 'system-ui, -apple-system, sans-serif',
              lineHeight: '1.75',
              fontSize: '16px'
            }}
          />
        );
      }

      // Eğer content JSON ise parse et
      const data = content ? JSON.parse(content) : null;
      console.log('📄 Parsed JSON data:', data);
      if (!data?.blocks) return <p className="text-gray-500">İçerik yok</p>;

      return (
        <div 
          className="max-w-none font-sans text-gray-900 leading-relaxed"
          style={{
            fontFamily: 'system-ui, -apple-system, sans-serif',
            lineHeight: '1.75',
            fontSize: '16px'
          }}
        >
          {data.blocks.map((block: any, index: number) => {
            switch (block.type) {
              case 'header':
                const HeaderTag = `h${block.data.level}` as keyof JSX.IntrinsicElements;
                const headerClasses = {
                  1: 'text-3xl font-bold mb-4 mt-6',
                  2: 'text-2xl font-bold mb-3 mt-5',
                  3: 'text-xl font-semibold mb-2 mt-4'
                };
                return (
                  <HeaderTag 
                    key={index} 
                    className={`${headerClasses[block.data.level as keyof typeof headerClasses] || 'text-lg font-semibold mb-2 mt-3'} text-gray-900`}
                  >
                    {block.data.text}
                  </HeaderTag>
                );
              
              case 'paragraph':
                return (
                  <p 
                    key={index} 
                    className="mb-4 leading-relaxed text-gray-800" 
                    dangerouslySetInnerHTML={{ __html: block.data.text }} 
                  />
                );
              
              case 'list':
                const ListTag = block.data.style === 'ordered' ? 'ol' : 'ul';
                return (
                  <ListTag key={index} className="mb-4 pl-6 space-y-1">
                    {block.data.items.map((item: string, i: number) => (
                      <li key={i} className="text-gray-800 leading-relaxed" dangerouslySetInnerHTML={{ __html: item }} />
                    ))}
                  </ListTag>
                );
              
              case 'image':
                return (
                  <figure key={index} className="my-6">
                    <img src={block.data.file?.url} alt={block.data.caption} className="rounded-lg w-full" />
                    {block.data.caption && (
                      <figcaption className="text-center text-sm text-gray-600 mt-2">{block.data.caption}</figcaption>
                    )}
                  </figure>
                );
              
              case 'quote':
                return (
                  <blockquote key={index} className="border-l-4 border-gray-300 pl-4 my-6 italic">
                    <p className="text-lg">{block.data.text}</p>
                    {block.data.caption && (
                      <cite className="text-sm text-gray-600 not-italic">— {block.data.caption}</cite>
                    )}
                  </blockquote>
                );
              
              case 'delimiter':
                return <hr key={index} className="my-8 border-t-2 border-gray-200" />;
              
              case 'table':
                return (
                  <div key={index} className="my-6 overflow-x-auto">
                    <table className="min-w-full border border-gray-300">
                      <tbody>
                        {block.data.content.map((row: string[], i: number) => (
                          <tr key={i} className={i === 0 && block.data.withHeadings ? 'bg-gray-100' : ''}>
                            {row.map((cell: string, j: number) => {
                              const CellTag = i === 0 && block.data.withHeadings ? 'th' : 'td';
                              return (
                                <CellTag key={j} className="border border-gray-300 px-4 py-2">
                                  {cell}
                                </CellTag>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              
              case 'embed':
                return (
                  <div key={index} className="my-6">
                    <iframe 
                      src={block.data.embed} 
                      width={block.data.width} 
                      height={block.data.height}
                      frameBorder="0"
                      allowFullScreen
                      className="w-full rounded-lg"
                    />
                  </div>
                );
              
              case 'raw':
                return <div key={index} className="my-4" dangerouslySetInnerHTML={{ __html: block.data.html }} />;
              
              default:
                return null;
            }
          })}
        </div>
      );
    } catch (error) {
      return <p className="text-red-500">Önizleme hatası</p>;
    }
  };

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-white' : 'relative'}`}>
      {/* Toolbar */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={(e) => {
              console.log('🎯 Preview button clicked!');
              e.preventDefault();
              e.stopPropagation();
              console.log('🎯 Current showPreview:', showPreview);
              setShowPreview(!showPreview);
              console.log('🎯 New showPreview will be:', !showPreview);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              showPreview 
                ? 'bg-green-100 text-green-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            title={showPreview ? 'Editöre Dön' : 'Önizleme'}
          >
            {showPreview ? <Code className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showPreview ? 'Düzenleme' : 'Önizleme'}
          </button>
          
          {isSaving ? (
            <div className="flex items-center gap-2 text-sm text-orange-600">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-orange-600 border-t-transparent"></div>
              <span>Değişiklikler algılanıyor...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <span>✓ Kaydedildi (Local)</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">💡 / tuşu ile blok menüsü | Kayıt butonu ile kalıcı kaydet</span>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleFullscreen();
            }}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title={isFullscreen ? 'Normal Ekran' : 'Tam Ekran'}
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Editor/Preview Container */}
      <div className={`${isFullscreen ? 'h-[calc(100vh-60px)] overflow-y-auto' : 'min-h-[500px]'} bg-white`}>
        {showPreview ? (
          <div className="max-w-4xl mx-auto px-6 py-8">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                👁️ <strong>Önizleme Modu:</strong> İçerik frontend'deki gibi görüntüleniyor
              </p>
              <div className="mt-2 text-xs text-blue-600">
                Content: {content ? `${content.substring(0, 100)}...` : 'Boş'}
              </div>
            </div>
            {renderPreview()}
          </div>
        ) : (
          <div className="max-w-4xl mx-auto px-6 py-8">
            <div 
              ref={holderRef} 
              id="editorjs"
              className="min-h-[400px]"
            />
          </div>
        )}
      </div>
    </div>
  );
}

