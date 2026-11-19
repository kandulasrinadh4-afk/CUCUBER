import React, { useState } from 'react';
import { ExternalLink, Image as ImageIcon, Maximize2, X } from 'lucide-react';

interface ChatMessageRendererProps {
  text: string;
  isDark: boolean;
}

export const ChatMessageRenderer: React.FC<ChatMessageRendererProps> = ({
  text,
  isDark,
}) => {
  const [lightboxSrc, setLightboxSrc] = useState<{ src: string; alt: string } | null>(null);

  // Helper to test if a URL is an image
  const isImageUrl = (url: string) => {
    if (!url) return false;
    const cleanUrl = url.split('?')[0].toLowerCase();
    return (
      cleanUrl.endsWith('.jpg') ||
      cleanUrl.endsWith('.jpeg') ||
      cleanUrl.endsWith('.png') ||
      cleanUrl.endsWith('.gif') ||
      cleanUrl.endsWith('.webp') ||
      cleanUrl.endsWith('.svg') ||
      url.includes('images.unsplash.com') ||
      url.includes('upload.wikimedia.org') ||
      url.includes('img1.hscicdn.com') ||
      url.includes('cricapi.com') ||
      url.includes('googleusercontent.com')
    );
  };

  // Process text line by line / block by block
  const lines = text.split('\n');

  const renderInlineContent = (content: string, lineKey: string | number) => {
    // Regex matching:
    // 1. Markdown images: ![alt](url)
    // 2. Markdown links: [title](url)
    // 3. Raw URLs: https?://...
    // 4. Bold: **text**
    // 5. Italic: *text*
    // 6. Inline code: `text`
    const tokenRegex = /(!\[.*?\]\(.*?\)|\[.*?\]\(.*?\)|\bhttps?:\/\/[^\s<>)"]+|\*\*.*?\*\*|\*.*?\*|`.*?`)/g;

    const parts = content.split(tokenRegex);

    return parts.map((chunk, idx) => {
      const key = `${lineKey}-${idx}`;

      // 1. Markdown Image: ![alt](url)
      const imgMatch = chunk.match(/^!\[(.*?)\]\((.*?)\)$/);
      if (imgMatch) {
        const alt = imgMatch[1] || 'Cricket Visual';
        const src = imgMatch[2];
        return <ChatImage key={key} src={src} alt={alt} isDark={isDark} onZoom={(s, a) => setLightboxSrc({ src: s, alt: a })} />;
      }

      // 2. Markdown Link: [title](url)
      const linkMatch = chunk.match(/^\[(.*?)\]\((.*?)\)$/);
      if (linkMatch) {
        const title = linkMatch[1];
        const url = linkMatch[2];

        // If the link URL is actually an image, render it as an image!
        if (isImageUrl(url)) {
          return <ChatImage key={key} src={url} alt={title} isDark={isDark} onZoom={(s, a) => setLightboxSrc({ src: s, alt: a })} />;
        }

        return (
          <a
            key={key}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 text-cyan-400 hover:text-cyan-300 underline font-medium break-all px-1 py-0.5 rounded bg-cyan-950/40 border border-cyan-800/30"
          >
            <span>{title}</span>
            <ExternalLink className="w-2.5 h-2.5 shrink-0 opacity-70" />
          </a>
        );
      }

      // 3. Raw Image URL (standalone URL string pointing to an image)
      if (chunk.startsWith('http://') || chunk.startsWith('https://')) {
        if (isImageUrl(chunk)) {
          return <ChatImage key={key} src={chunk} alt="Cricket Visual" isDark={isDark} onZoom={(s, a) => setLightboxSrc({ src: s, alt: a })} />;
        }
        return (
          <a
            key={key}
            href={chunk}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 text-cyan-400 hover:text-cyan-300 underline font-mono text-xs break-all px-1 py-0.5 rounded bg-cyan-950/40 border border-cyan-800/30"
          >
            <span>{chunk.length > 35 ? chunk.slice(0, 35) + '...' : chunk}</span>
            <ExternalLink className="w-2.5 h-2.5 shrink-0 opacity-70" />
          </a>
        );
      }

      // 4. Bold: **text**
      if (chunk.startsWith('**') && chunk.endsWith('**') && chunk.length >= 4) {
        return (
          <strong key={key} className={isDark ? 'font-bold text-cyan-300' : 'font-bold text-cyan-900'}>
            {chunk.slice(2, -2)}
          </strong>
        );
      }

      // 5. Italic: *text*
      if (chunk.startsWith('*') && chunk.endsWith('*') && chunk.length >= 2) {
        return (
          <em key={key} className="italic text-slate-300">
            {chunk.slice(1, -1)}
          </em>
        );
      }

      // 6. Inline Code: `text`
      if (chunk.startsWith('`') && chunk.endsWith('`') && chunk.length >= 2) {
        return (
          <code
            key={key}
            className={`px-1.5 py-0.5 rounded text-xs font-mono ${
              isDark ? 'bg-slate-900 text-amber-300 border border-slate-700' : 'bg-slate-200 text-amber-900 border border-slate-300'
            }`}
          >
            {chunk.slice(1, -1)}
          </code>
        );
      }

      return chunk;
    });
  };

  return (
    <div className="space-y-2 text-xs sm:text-sm leading-relaxed">
      {lines.map((line, lineIdx) => {
        const trimmed = line.trim();

        // Empty line
        if (!trimmed) {
          return <div key={lineIdx} className="h-1.5" />;
        }

        // Header 3 (### Heading)
        if (trimmed.startsWith('### ')) {
          return (
            <h4
              key={lineIdx}
              className={`font-bold text-sm sm:text-base pt-1 pb-0.5 ${
                isDark ? 'text-white border-b border-slate-800' : 'text-slate-900 border-b border-slate-200'
              }`}
            >
              {renderInlineContent(trimmed.slice(4), lineIdx)}
            </h4>
          );
        }

        // Header 2 (## Heading)
        if (trimmed.startsWith('## ')) {
          return (
            <h3
              key={lineIdx}
              className={`font-black text-sm sm:text-base pt-1.5 pb-0.5 ${
                isDark ? 'text-cyan-300' : 'text-cyan-900'
              }`}
            >
              {renderInlineContent(trimmed.slice(3), lineIdx)}
            </h3>
          );
        }

        // Bullet point
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <div key={lineIdx} className="flex items-start gap-2 pl-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0 mt-1.5" />
              <div className="flex-1">{renderInlineContent(trimmed.slice(2), lineIdx)}</div>
            </div>
          );
        }

        // Numbered list (e.g., "1. ")
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
        if (numMatch) {
          return (
            <div key={lineIdx} className="flex items-start gap-2 pl-1.5">
              <span className="font-mono font-bold text-cyan-400 text-xs shrink-0 mt-0.5">
                {numMatch[1]}.
              </span>
              <div className="flex-1">{renderInlineContent(numMatch[2], lineIdx)}</div>
            </div>
          );
        }

        return (
          <p key={lineIdx} className="leading-relaxed">
            {renderInlineContent(line, lineIdx)}
          </p>
        );
      })}

      {/* Lightbox / Zoom Modal */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightboxSrc(null)}
        >
          <div className="relative max-w-2xl max-h-[85vh] bg-slate-900 rounded-3xl p-2 border border-slate-700 shadow-2xl overflow-hidden">
            <button
              onClick={() => setLightboxSrc(null)}
              className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={lightboxSrc.src}
              alt={lightboxSrc.alt}
              referrerPolicy="no-referrer"
              className="w-full h-auto max-h-[75vh] object-contain rounded-2xl"
            />
            {lightboxSrc.alt && (
              <p className="text-center text-xs text-slate-300 font-medium py-2 px-4">
                {lightboxSrc.alt}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface ChatImageProps {
  src: string;
  alt: string;
  isDark: boolean;
  onZoom: (src: string, alt: string) => void;
}

const ChatImage: React.FC<ChatImageProps> = ({ src, alt, isDark, onZoom }) => {
  const [loadError, setLoadError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  if (loadError) {
    return (
      <div
        className={`my-2 p-2.5 rounded-2xl border flex items-center gap-2 text-xs ${
          isDark
            ? 'bg-slate-900/60 border-slate-800 text-slate-400'
            : 'bg-slate-100 border-slate-200 text-slate-600'
        }`}
      >
        <ImageIcon className="w-4 h-4 text-cyan-400 shrink-0" />
        <span className="truncate">{alt || 'Image Preview'}</span>
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto text-cyan-400 underline shrink-0 text-[11px]"
        >
          Open Link
        </a>
      </div>
    );
  }

  return (
    <div className="my-2.5 block max-w-sm rounded-2xl overflow-hidden border border-cyan-500/20 bg-slate-900/80 shadow-md group relative">
      {isLoading && (
        <div className="h-40 w-full bg-slate-800 animate-pulse flex items-center justify-center">
          <ImageIcon className="w-6 h-6 text-slate-600 animate-spin" />
        </div>
      )}
      <img
        src={src}
        alt={alt || 'Cricket Visual'}
        referrerPolicy="no-referrer"
        loading="lazy"
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setLoadError(true);
        }}
        className={`w-full max-h-56 object-cover cursor-pointer transition-transform duration-200 group-hover:scale-102 ${
          isLoading ? 'hidden' : 'block'
        }`}
        onClick={() => onZoom(src, alt)}
      />
      {!isLoading && (
        <div className="p-2 px-3 bg-slate-950/80 backdrop-blur-xs flex items-center justify-between gap-2 border-t border-white/5">
          <span className="text-[11px] text-slate-300 font-medium truncate">
            {alt || 'Cricket Visual'}
          </span>
          <button
            type="button"
            onClick={() => onZoom(src, alt)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
            title="Expand Image"
          >
            <Maximize2 className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
};
