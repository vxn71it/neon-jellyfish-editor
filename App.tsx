import React, { useState, useRef } from 'react';
import { Upload, Wand2, Download, RefreshCw, Image as ImageIcon, Zap } from 'lucide-react';
import { editImageWithGemini } from './services/gemini';
import { fileToBase64, downloadImage } from './utils/imageUtils';
import { Spinner } from './components/Spinner';

// Use a default image that fits the "Jellyfish" theme if user hasn't uploaded
const DEFAULT_PLACEHOLDER = "https://picsum.photos/seed/jellyfish/800/600";

const App: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>("image/jpeg");
  const [prompt, setPrompt] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 4 * 1024 * 1024) {
        setError("File size too large. Please select an image under 4MB.");
        return;
      }
      try {
        const base64 = await fileToBase64(file);
        setOriginalImage(base64);
        setCurrentImage(base64);
        setMimeType(file.type);
        setError(null);
        setPrompt(""); // Reset prompt on new image
      } catch (err) {
        setError("Failed to load image.");
      }
    }
  };

  const handleGenerate = async () => {
    if (!currentImage || !prompt.trim()) return;

    setLoading(true);
    setError(null);

    try {
      // Use the CURRENT image state as input for progressive editing
      const result = await editImageWithGemini(currentImage, mimeType, prompt);
      
      if (result.imageUrl) {
        setCurrentImage(result.imageUrl);
        // We default to PNG for generated images usually, but let's keep track loosely
        setMimeType("image/png"); 
      } else if (result.text) {
        // If no image returned, but we have text, show it (often an error or refusal)
        setError(`Model message: ${result.text}`);
      } else {
        setError("The model did not return an image. Try a different prompt.");
      }
    } catch (err) {
      setError("Failed to generate image. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setCurrentImage(originalImage);
    setPrompt("");
    setError(null);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const presetPrompts = [
    "Make it look like a neon sign",
    "Convert to black and white sketch",
    "Add a retro VHS filter",
    "Crop this image in 1200x1200 px with proper visibility"
  ];

  return (
    <div className="min-h-screen p-4 md:p-8">
      <header className="max-w-6xl mx-auto mb-10 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-neonCyan flex items-center justify-center shadow-[0_0_15px_rgba(0,212,255,0.5)]">
             <Zap className="text-deepBlue w-6 h-6" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Neon Jellyfish AI <span className="text-neonCyan font-light">Editor</span>
          </h1>
        </div>
        <div className="text-sm text-blue-200 opacity-80 hidden sm:block">
          <a href="https://vxn71itco.com/">Technical Developer VXN 71 IT</a>
        </div>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Controls */}
        <div className="glass-panel rounded-2xl p-6 flex flex-col space-y-6 h-fit order-2 lg:order-1">
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Upload className="w-5 h-5 mr-2 text-neonCyan" /> Source
            </h2>
            <div 
              onClick={triggerFileInput}
              className="border-2 border-dashed border-blue-500/50 hover:border-neonCyan/80 rounded-xl p-8 text-center cursor-pointer transition-colors group bg-black/20"
            >
              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleFileSelect}
              />
              <div className="flex flex-col items-center text-blue-200 group-hover:text-white">
                <ImageIcon className="w-12 h-12 mb-2 opacity-70 group-hover:opacity-100 transition-opacity" />
                <span className="text-sm font-medium">Click to upload image</span>
                <span className="text-xs opacity-50 mt-1">JPG, PNG, JPEG, WEBP (Max 4MB)</span>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Wand2 className="w-5 h-5 mr-2 text-neonCyan" /> Edit Prompt
            </h2>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe how to change the image (e.g., 'Add glowing edges' or 'Crop to square')"
              className="w-full h-32 bg-black/30 border border-blue-500/30 rounded-xl p-4 text-white placeholder-blue-300/30 focus:outline-none focus:border-neonCyan focus:ring-1 focus:ring-neonCyan transition-all resize-none"
            />
            
            <div className="mt-3 flex flex-wrap gap-2">
              {presetPrompts.map((p, i) => (
                <button
                  key={i}
                  onClick={() => setPrompt(p)}
                  className="text-xs bg-blue-900/40 hover:bg-blue-800/60 text-blue-200 border border-blue-700/50 px-3 py-1 rounded-full transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || !currentImage || !prompt}
            className={`
              w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center shadow-lg
              transition-all transform active:scale-95
              ${loading || !currentImage || !prompt 
                ? 'bg-gray-800/50 text-gray-500 cursor-not-allowed' 
                : 'bg-gradient-to-r from-oceanBlue to-blue-900 hover:from-neonCyan hover:to-blue-600 text-white hover:shadow-[0_0_20px_rgba(0,212,255,0.4)]'
              }
            `}
          >
            {loading ? 'Processing...' : 'Generate Edit'}
          </button>

          {error && (
             <div className="p-3 bg-red-900/50 border border-red-500/50 rounded-lg text-red-200 text-sm text-center break-words">
               {error}
             </div>
          )}
        </div>

        {/* Right Column: Preview */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 flex flex-col relative min-h-[500px] order-1 lg:order-2">
          <div className="flex justify-between items-center mb-4">
             <h2 className="text-xl font-semibold">Preview</h2>
             <div className="flex space-x-2">
               {currentImage && originalImage && (
                 <button 
                  onClick={handleReset}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                  title="Reset to original"
                 >
                   <RefreshCw className="w-5 h-5" />
                 </button>
               )}
               {currentImage && (
                 <button 
                  onClick={() => downloadImage(currentImage, 'edited-image.png')}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                  title="Download"
                 >
                   <Download className="w-5 h-5" />
                 </button>
               )}
             </div>
          </div>

          <div className="flex-grow flex items-center justify-center bg-black/40 rounded-xl border-2 border-dashed border-white/5 overflow-hidden relative">
            {loading ? (
              <Spinner />
            ) : currentImage ? (
              <img 
                src={currentImage} 
                alt="Preview" 
                className="max-w-full max-h-[600px] object-contain shadow-2xl rounded-lg"
              />
            ) : (
               <div className="text-center p-10">
                 <div className="w-24 h-24 bg-blue-500/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <ImageIcon className="w-10 h-10 text-blue-400/50" />
                 </div>
                 <p className="text-blue-200/60 text-lg">Upload an image to start editing</p>
               </div>
            )}
            
            {/* Decorative elements inspired by the jellyfish */}
            <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-neonCyan/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -top-10 -left-10 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>
          </div>
          
          {/* Comparison Hint */}
          {originalImage && currentImage && originalImage !== currentImage && (
             <div className="mt-4 text-center text-xs text-white/40">
               Image updated successfully. You can continue adding prompts to refine further.
             </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;