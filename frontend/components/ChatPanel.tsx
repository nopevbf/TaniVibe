import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Sprout, User, ShoppingCart, Search, Camera, ImagePlus, X, Loader2 } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { ChatMessage, FarmMemory } from '../types';
import { chatWithAI, summarizeHistory, extractFarmFacts } from '../services/aiService';

// Threshold pesan sebelum history lama diringkas dan di-trim
const SUMMARIZE_THRESHOLD = 25;
// Berapa pesan terbaru yang tetap disimpan utuh setelah summarize
const KEEP_RECENT = 20;

// Tipe MIME yang didukung Gemini Vision
type SupportedMime = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';
const SUPPORTED_MIMES: SupportedMime[] = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE_MB = 4;

interface ChatPanelProps {
  ai: GoogleGenAI;
  globalContext: string;
  chatTrigger: { text: string; ts: number } | null;
  farmMemory: FarmMemory;
  onUpdateMemory: (updates: Partial<FarmMemory>) => void;
}

// ---------------------------------------------------------------------------
// Helper: File → base64 murni + previewUrl
// ---------------------------------------------------------------------------
const fileToBase64 = (file: File): Promise<{ base64: string; previewUrl: string }> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      resolve({ base64: dataUrl.split(',')[1], previewUrl: dataUrl });
    };
    reader.onerror = () => reject(new Error('Gagal membaca file gambar.'));
    reader.readAsDataURL(file);
  });

// ---------------------------------------------------------------------------
// Helper: kompres gambar jika > MAX_FILE_SIZE_MB
// ---------------------------------------------------------------------------
const compressImageIfNeeded = (file: File): Promise<File> =>
  new Promise((resolve) => {
    if (file.size <= MAX_FILE_SIZE_MB * 1024 * 1024 && file.type !== 'image/gif') {
      resolve(file);
      return;
    }
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const maxDim = 1280;
      let { width, height } = img;
      if (width > height && width > maxDim) { height = Math.round((height * maxDim) / width); width = maxDim; }
      else if (height > maxDim) { width = Math.round((width * maxDim) / height); height = maxDim; }
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        blob => {
          URL.revokeObjectURL(url);
          if (blob) resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }));
          else resolve(file);
        },
        'image/jpeg',
        0.82
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });

// ---------------------------------------------------------------------------
// ChatPanel
// ---------------------------------------------------------------------------
const ChatPanel: React.FC<ChatPanelProps> = ({
  ai,
  globalContext,
  chatTrigger,
  farmMemory,
  onUpdateMemory,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: 'Halo Pak/Bu! Saya TaniVibe, asisten pertanian Anda. Silakan tanya apa saja — soal cuaca, hama, pupuk, atau kirim foto tanaman untuk saya analisis! 🌱📷',
      isWelcome: true,
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // State gambar pending (belum dikirim)
  const [pendingImage, setPendingImage] = useState<{
    base64: string;
    mimeType: SupportedMime;
    previewUrl: string;
    fileName: string;
  } | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef(messages);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isLoading]);

  useEffect(() => {
    if (chatTrigger) handleSendMessage(chatTrigger.text);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatTrigger]);

  // -------------------------------------------------------------------------
  // SUMMARIZE & TRIM — dari versi original kamu
  // -------------------------------------------------------------------------
  const maybeSummarizeAndTrim = async (currentMessages: ChatMessage[]) => {
    const nonWelcome = currentMessages.filter(m => !m.isWelcome);
    if (nonWelcome.length < SUMMARIZE_THRESHOLD) return currentMessages;

    const toSummarize = nonWelcome.slice(0, nonWelcome.length - KEEP_RECENT);
    const toKeep = nonWelcome.slice(nonWelcome.length - KEEP_RECENT);

    try {
      const newSummary = await summarizeHistory(ai, toSummarize, farmMemory.conversationSummary);
      onUpdateMemory({
        conversationSummary: newSummary,
        summaryUpdatedAt: new Date().toISOString(),
      });
      const welcomeMsg = currentMessages.find(m => m.isWelcome);
      return welcomeMsg ? [welcomeMsg, ...toKeep] : toKeep;
    } catch (e) {
      console.warn('Summarize failed, keeping full history:', e);
      return currentMessages;
    }
  };

  // -------------------------------------------------------------------------
  // PROSES FILE GAMBAR
  // -------------------------------------------------------------------------
  const processImageFile = useCallback(async (file: File) => {
    setImageError(null);
    if (!SUPPORTED_MIMES.includes(file.type as SupportedMime)) {
      setImageError('Format tidak didukung. Gunakan JPG, PNG, WebP, atau GIF.');
      return;
    }
    try {
      const compressed = await compressImageIfNeeded(file);
      const { base64, previewUrl } = await fileToBase64(compressed);
      setPendingImage({ base64, mimeType: compressed.type as SupportedMime, previewUrl, fileName: file.name });
      textareaRef.current?.focus();
    } catch {
      setImageError('Gagal memuat gambar. Coba lagi.');
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImageFile(file);
    e.target.value = '';
  };

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const imageItem = Array.from(e.clipboardData.items).find(item => item.type.startsWith('image/'));
    if (imageItem) {
      e.preventDefault();
      const file = imageItem.getAsFile();
      if (file) processImageFile(file);
    }
  }, [processImageFile]);

  const removePendingImage = () => { setPendingImage(null); setImageError(null); };

  // -------------------------------------------------------------------------
  // SEND MESSAGE
  // -------------------------------------------------------------------------
  const handleSendMessage = async (text: string) => {
    const finalText = text.trim();
    if (!finalText && !pendingImage) return;
    if (isLoading) return;

    const newUserMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: finalText,
      ...(pendingImage && {
        image: {
          base64: pendingImage.base64,
          mimeType: pendingImage.mimeType,
          previewUrl: pendingImage.previewUrl,
        }
      })
    };

    const updatedMessages = [...messagesRef.current, newUserMsg];
    setMessages(updatedMessages);
    setInputValue('');
    setPendingImage(null);
    setImageError(null);
    setIsLoading(true);

    // Reset textarea height
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    try {
      const responseText = await chatWithAI(ai, updatedMessages, farmMemory, globalContext);

      const newModelMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
      };

      const messagesWithResponse = [...updatedMessages, newModelMsg];

      // Ekstrak fakta baru dari teks user dan update memory
      if (finalText) {
        const memoryUpdates = extractFarmFacts(finalText, responseText, farmMemory);
        if (Object.keys(memoryUpdates).length > 0) {
          onUpdateMemory(memoryUpdates);
        }
      }

      // Summarize & trim jika history sudah panjang
      const finalMessages = await maybeSummarizeAndTrim(messagesWithResponse);
      setMessages(finalMessages);

    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: 'Maaf, terjadi kesalahan saat menghubungi sistem. Silakan coba lagi nanti.',
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputValue);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  // -------------------------------------------------------------------------
  // QUICK QUESTIONS
  // -------------------------------------------------------------------------
  const quickQuestions = [
    "🌾 Waktu tanam padi",
    "🐛 Hama wereng",
    "☀️ Cuaca panen",
    "💧 Irigasi cabai"
  ];

  // -------------------------------------------------------------------------
  // EXTRACT PRODUCT TAGS
  // -------------------------------------------------------------------------
  const extractProducts = (text: string) => {
    const regex = /\[PRODUK:\s*([^\]]+)\]/i;
    const match = text.match(regex);
    let products: string[] = [];
    let cleanText = text;
    if (match) {
      products = match[1].split(',').map(p => p.trim()).filter(p => p.length > 0);
      cleanText = text.replace(regex, '').trim();
    }
    return { cleanText, products };
  };

  // -------------------------------------------------------------------------
  // PRODUCT IMAGE — dari versi original kamu (lebih lengkap)
  // -------------------------------------------------------------------------
  const getProductImage = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('npk') || lower.includes('mutiara') || lower.includes('phonska') || lower.includes('urea') || lower.includes('za') || lower.includes('kcl') || lower.includes('pupuk'))
      return 'https://images.unsplash.com/photo-1628352081506-83c43123ed6d?w=280&h=200&fit=crop';
    if (lower.includes('antracol') || lower.includes('ditane') || lower.includes('score') || lower.includes('fungisida') || lower.includes('bakterisida'))
      return 'https://images.unsplash.com/photo-1584744982491-665216d95f8b?w=280&h=200&fit=crop';
    if (lower.includes('regent') || lower.includes('applaud') || lower.includes('confidor') || lower.includes('curacron') || lower.includes('insektisida') || lower.includes('pestisida') || lower.includes('herbisida') || lower.includes('roundup') || lower.includes('gramoxone') || lower.includes('akarisida') || lower.includes('agrimec') || lower.includes('pegasus'))
      return 'https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0?w=280&h=200&fit=crop';
    if (lower.includes('benih') || lower.includes('bibit') || lower.includes('bisi') || lower.includes('pioneer') || lower.includes('biji'))
      return 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=280&h=200&fit=crop';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=eef1e8&color=2d6a4f&size=280&font-size=0.3&bold=true`;
  };

  // -------------------------------------------------------------------------
  // FORMAT MESSAGE — versi robust (perbaikan dari iterasi sebelumnya)
  // -------------------------------------------------------------------------
  const renderInline = (text: string, isUser: boolean): React.ReactNode[] =>
    text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**'))
        return <strong key={i} className={`font-semibold ${isUser ? 'text-white' : 'text-tanivibe-ink'}`}>{part.slice(2, -2)}</strong>;
      return <React.Fragment key={i}>{part}</React.Fragment>;
    });

  const formatMessage = (text: string, isUser: boolean): React.ReactNode[] => {
    const lines = text.split('\n');
    const result: React.ReactNode[] = [];
    let paraBuffer: string[] = [];

    const flushParagraph = (key: string) => {
      if (!paraBuffer.length) return;
      const joined = paraBuffer.join(' ').trim();
      if (joined) result.push(<p key={key} className="mb-1 last:mb-0">{renderInline(joined, isUser)}</p>);
      paraBuffer = [];
    };

    lines.forEach((rawLine, i) => {
      const line = rawLine.trimStart();
      if (line === '') { flushParagraph(`para-${i}`); return; }

      // Blockquote
      if (line.startsWith('> ')) {
        flushParagraph(`pbq-${i}`);
        result.push(
          <div key={`quote-${i}`} className="bg-white border-l-4 border-tanivibe-green p-3 rounded-r-lg mt-3 mb-1 italic text-tanivibe-ink shadow-sm">
            {renderInline(line.slice(2), isUser)}
          </div>
        );
        return;
      }

      // Bullet point
      if (line.startsWith('* ') || line.startsWith('- ')) {
        flushParagraph(`pbb-${i}`);
        result.push(
          <div key={`bullet-${i}`} className="flex items-start gap-2 mt-2 mb-2">
            <div className={`w-1.5 h-1.5 rounded-full shrink-0 mt-2 ${isUser ? 'bg-white' : 'bg-tanivibe-green'}`} />
            <div className="flex-1">{renderInline(line.slice(2), isUser)}</div>
          </div>
        );
        return;
      }

      // Heading markdown yang lolos — strip dan render sebagai teks tebal
      if (line.startsWith('#')) {
        flushParagraph(`pbh-${i}`);
        result.push(<p key={`h-${i}`} className="font-semibold mt-2 mb-1">{renderInline(line.replace(/^#+\s*/, ''), isUser)}</p>);
        return;
      }

      paraBuffer.push(line);
    });

    flushParagraph('para-end');
    return result;
  };

  // -------------------------------------------------------------------------
  // RENDER
  // -------------------------------------------------------------------------
  const canSend = (!!inputValue.trim() || !!pendingImage) && !isLoading;

  return (
    <div className="max-w-3xl mx-auto w-full p-4 md:p-8 flex-1 flex flex-col min-h-[500px]">
      {/* Hidden file inputs */}
      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleFileChange} />
      <input ref={cameraInputRef} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" className="hidden" onChange={handleFileChange} />

      <div className="flex-1 bg-tanivibe-surface border border-tanivibe-border rounded-xl shadow-subtle flex flex-col overflow-hidden">

        {/* Header */}
        <div className="p-4 border-b border-tanivibe-border bg-tanivibe-bg2 flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-full bg-tanivibe-green flex items-center justify-center text-white">
            <Sprout className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-semibold text-tanivibe-ink">TaniVibe Assistant</h2>
            <p className="text-xs text-tanivibe-ink3">Tanya atau kirim foto tanaman untuk dianalisis</p>
          </div>
          {/* Memory indicator — dari versi original kamu */}
          {farmMemory.cropTypes.length > 0 && (
            <div className="text-[10px] bg-tanivibe-green-l border border-tanivibe-green-m text-tanivibe-green px-2 py-1 rounded-full font-medium">
              🌱 {farmMemory.cropTypes.join(', ')}
            </div>
          )}
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {messages.map((msg) => {
            const { cleanText, products } = extractProducts(msg.text);
            const isUser = msg.role === 'user';

            return (
              <div key={msg.id} className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${isUser ? 'bg-tanivibe-ink2 text-white' : 'bg-tanivibe-green text-white'}`}>
                  {isUser ? <User className="w-4 h-4" /> : <Sprout className="w-4 h-4" />}
                </div>
                <div className={`max-w-[85%] rounded-2xl ${isUser ? 'bg-tanivibe-green text-white rounded-tr-sm' : 'bg-tanivibe-bg2 text-tanivibe-ink border border-tanivibe-border rounded-tl-sm'}`}>

                  {/* Gambar yang dikirim user */}
                  {isUser && msg.image && (
                    <div className="p-2 pb-0">
                      <img
                        src={msg.image.previewUrl}
                        alt="Foto tanaman"
                        className="w-full max-w-[260px] rounded-xl object-cover border-2 border-white/20"
                        style={{ maxHeight: 200 }}
                      />
                    </div>
                  )}

                  {/* Teks pesan */}
                  <div className="p-4 text-sm leading-relaxed">
                    {formatMessage(
                      cleanText || (isUser && msg.image && !msg.text ? '📷 Foto dikirim' : cleanText),
                      isUser
                    )}
                  </div>

                  {/* Product Cards — pakai Google Shopping (dari versi original kamu) */}
                  {products.length > 0 && !isUser && (
                    <div className="px-4 pb-4 pt-0">
                      <div className="pt-3 border-t border-tanivibe-border/50">
                        <div className="text-[11px] font-semibold text-tanivibe-ink3 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                          <ShoppingCart className="w-3.5 h-3.5" /> Rekomendasi Produk
                        </div>
                        <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
                          {products.map((prod, idx) => (
                            <div key={idx} className="w-[140px] bg-white border border-tanivibe-border rounded-xl overflow-hidden shadow-sm shrink-0 snap-start flex flex-col">
                              <img src={getProductImage(prod)} alt={prod} className="w-full h-24 object-cover border-b border-tanivibe-border/50" />
                              <div className="p-2.5 flex flex-col flex-1">
                                <h4 className="text-xs font-semibold text-tanivibe-ink mb-2 line-clamp-2 flex-1" title={prod}>{prod}</h4>
                                <div className="flex mt-auto">
                                  <a
                                    href={`https://www.google.com/search?tbm=shop&q=${encodeURIComponent(prod + ' pertanian')}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="w-full text-center bg-tanivibe-green text-white text-[10px] font-bold py-1.5 rounded hover:bg-[#1e4f3a] transition-colors flex items-center justify-center gap-1"
                                  >
                                    <Search className="w-3 h-3" /> Cari
                                  </a>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Loading */}
          {isLoading && (
            <div className="flex gap-3 flex-row">
              <div className="w-8 h-8 rounded-full bg-tanivibe-green text-white flex items-center justify-center shrink-0">
                <Sprout className="w-4 h-4" />
              </div>
              <div className="bg-tanivibe-bg2 border border-tanivibe-border rounded-2xl rounded-tl-sm p-4 flex gap-1 items-center">
                <div className="w-2 h-2 bg-tanivibe-ink3 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-tanivibe-ink3 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-tanivibe-ink3 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Questions */}
        <div className="px-4 pb-3 flex flex-wrap gap-2 shrink-0">
          {quickQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(q.replace(/^\p{Emoji_Presentation}\s*/u, '').trim())}
              disabled={isLoading}
              className="px-3 py-1.5 border border-tanivibe-border rounded-full bg-transparent text-xs text-tanivibe-ink2 hover:bg-tanivibe-green-l hover:border-tanivibe-green-m hover:text-tanivibe-green transition-colors disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>

        {/* ── Input Area ── */}
        <div className="p-3 border-t border-tanivibe-border bg-tanivibe-surface shrink-0 space-y-2">

          {/* Preview gambar pending */}
          {pendingImage && (
            <div className="flex items-start gap-3 bg-tanivibe-bg2 border border-tanivibe-border rounded-xl p-2.5">
              <img src={pendingImage.previewUrl} alt="Preview" className="w-16 h-16 rounded-lg object-cover border border-tanivibe-border shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-tanivibe-ink truncate">{pendingImage.fileName}</p>
                <p className="text-[11px] text-tanivibe-ink3 mt-0.5">Siap dikirim — tambahkan pertanyaan jika perlu</p>
              </div>
              <button onClick={removePendingImage} className="text-tanivibe-ink3 hover:text-red-500 transition-colors shrink-0 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Error gambar */}
          {imageError && (
            <div className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex items-center gap-2">
              <X className="w-3.5 h-3.5 shrink-0" /> {imageError}
            </div>
          )}

          {/* Baris input utama */}
          <div className="flex items-end gap-2">
            {/* Kamera — mobile, buka kamera belakang langsung */}
            <button
              onClick={() => cameraInputRef.current?.click()}
              disabled={isLoading}
              title="Ambil foto"
              className="p-2.5 rounded-lg border border-tanivibe-border text-tanivibe-ink2 hover:bg-tanivibe-green-l hover:text-tanivibe-green hover:border-tanivibe-green-m transition-colors disabled:opacity-40 shrink-0"
            >
              <Camera className="w-5 h-5" />
            </button>

            {/* Upload dari galeri */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              title="Unggah foto dari galeri"
              className="p-2.5 rounded-lg border border-tanivibe-border text-tanivibe-ink2 hover:bg-tanivibe-green-l hover:text-tanivibe-green hover:border-tanivibe-green-m transition-colors disabled:opacity-40 shrink-0"
            >
              <ImagePlus className="w-5 h-5" />
            </button>

            {/* Textarea — auto-resize, support Shift+Enter */}
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputValue}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder={pendingImage ? 'Tambahkan pertanyaan... (opsional)' : 'Ketik pertanyaan atau tempel foto...'}
              disabled={isLoading}
              className="flex-1 bg-tanivibe-bg border border-tanivibe-border rounded-lg px-4 py-2.5 text-sm text-tanivibe-ink outline-none focus:border-tanivibe-green transition-colors disabled:opacity-50 resize-none leading-relaxed"
              style={{ minHeight: '42px', maxHeight: '120px' }}
            />

            {/* Tombol Kirim */}
            <button
              onClick={() => handleSendMessage(inputValue)}
              disabled={!canSend}
              className="bg-tanivibe-green text-white p-2.5 rounded-lg hover:bg-[#1e4f3a] transition-colors disabled:opacity-40 flex items-center justify-center shrink-0"
            >
              {isLoading
                ? <Loader2 className="w-5 h-5 animate-spin" />
                : <Send className="w-5 h-5" />}
            </button>
          </div>

          {/* Hint paste — desktop only */}
          <p className="text-[10px] text-tanivibe-ink3 text-center hidden md:block">
            💡 Bisa juga tempel gambar langsung dengan{' '}
            <kbd className="bg-tanivibe-bg2 border border-tanivibe-border px-1 py-0.5 rounded text-[9px]">Ctrl+V</kbd>
          </p>
        </div>

      </div>
    </div>
  );
};

export default ChatPanel;