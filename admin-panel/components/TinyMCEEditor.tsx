'use client';

import { useRef } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import type { Editor as TinyMCEEditor } from 'tinymce';

interface TinyMCEEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  height?: number;
}

export default function TinyMCEEditorComponent({ 
  content, 
  onChange, 
  placeholder = 'İçeriğinizi buraya yazın...',
  height = 500 
}: TinyMCEEditorProps) {
  const editorRef = useRef<TinyMCEEditor | null>(null);

  return (
    <Editor
      apiKey="no-api-key" // Ücretsiz kullanım için (bazı özellikler sınırlı)
      onInit={(evt, editor) => editorRef.current = editor}
      value={content}
      onEditorChange={(newContent) => {
        onChange(newContent);
      }}
      init={{
        height: height,
        menubar: 'file edit view insert format tools table help',
        branding: false,
        promotion: false,
        plugins: [
          'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
          'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
          'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount',
          'emoticons', 'codesample', 'quickbars'
        ],
        toolbar: 'undo redo | blocks | ' +
          'bold italic underline strikethrough | forecolor backcolor | ' +
          'alignleft aligncenter alignright alignjustify | ' +
          'bullist numlist outdent indent | ' +
          'link image media table | ' +
          'removeformat code fullscreen | help',
        quickbars_selection_toolbar: 'bold italic | quicklink h2 h3 blockquote',
        quickbars_insert_toolbar: 'quickimage quicktable',
        contextmenu: 'link image table',
        content_style: `
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif; 
            font-size: 14px;
            line-height: 1.6;
            padding: 16px;
          }
        `,
        placeholder: placeholder,
        // Gelişmiş özellikler
        image_advtab: true,
        link_assume_external_targets: true,
        link_title: false,
        target_list: [
          { title: 'Yeni Sekme', value: '_blank' },
          { title: 'Aynı Sayfa', value: '_self' }
        ],
        // Tablo özellikleri
        table_toolbar: 'tableprops tabledelete | tableinsertrowbefore tableinsertrowafter tabledeleterow | tableinsertcolbefore tableinsertcolafter tabledeletecol',
        table_appearance_options: true,
        table_grid: true,
        table_resize_bars: true,
        // Kod highlighting
        codesample_languages: [
          { text: 'HTML/XML', value: 'markup' },
          { text: 'JavaScript', value: 'javascript' },
          { text: 'CSS', value: 'css' },
          { text: 'PHP', value: 'php' },
          { text: 'Python', value: 'python' },
          { text: 'SQL', value: 'sql' },
          { text: 'Bash', value: 'bash' }
        ],
        // Resim yükleme (base64 - geliştirilebilir)
        automatic_uploads: true,
        file_picker_types: 'image',
        images_upload_handler: async (blobInfo) => {
          // Burada resmi sunucuya yükleyebilirsiniz
          // Şimdilik base64 döndürüyoruz
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
              resolve(reader.result as string);
            };
            reader.readAsDataURL(blobInfo.blob());
          });
        },
      }}
    />
  );
}

