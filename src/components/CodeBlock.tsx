import React, { useState, useEffect } from 'react';
import { CopyIcon, CheckIcon, PreviewIcon, CodeIcon, FullScreenIcon, ExitFullScreenIcon } from './icons';

interface CodeBlockPart {
    language: string;
    content: string;
}
  
interface CodeBlockProps {
    parts: CodeBlockPart[];
}

const PREVIEWABLE_LANGUAGES = ['html', 'javascript', 'css'];

const createCombinedHtmlForPreview = (parts: CodeBlockPart[]): string => {
    let html = parts.find(p => p.language.toLowerCase() === 'html')?.content || '<html><head><meta charset="UTF-8"><title>Preview</title></head><body><div id="root"></div></body></html>';
    const css = parts.filter(p => p.language.toLowerCase() === 'css').map(p => p.content).join('\n');
    const js = parts.filter(p => p.language.toLowerCase() === 'javascript').map(p => p.content).join('\n');

    const styleTag = `<style>body { background-color: #fff; color: #000; font-family: sans-serif; padding: 1rem; } ${css}</style>`;
    html = html.replace('</head>', `${styleTag}</head>`);
    
    if (js) {
        const safeJs = `
            try {
                ${js}
            } catch (e) {
                document.body.innerHTML += \`<pre style="color: red; border: 1px solid red; padding: 10px;">Error: \${e.message}</pre>\`;
                console.error(e);
            }
        `;
        html = html.replace('</body>', `<script type="module">${safeJs}</script></body>`);
    }

    return html;
};

const createUnifiedCodeString = (parts: CodeBlockPart[]): { language: string, content: string } => {
    if (parts.length === 1) {
        return { language: parts[0].language, content: parts[0].content };
    }

    const hasWebContent = parts.some(p => PREVIEWABLE_LANGUAGES.includes(p.language.toLowerCase()));
    
    if (hasWebContent) {
        const html = parts.find(p => p.language.toLowerCase() === 'html')?.content || '<!-- No HTML provided -->';
        const css = parts.filter(p => p.language.toLowerCase() === 'css').map(p => p.content).join('\n\n');
        const js = parts.filter(p => p.language.toLowerCase() === 'javascript').map(p => p.content).join('\n\n');
        
        let content = html;
        if (css) {
            content += `\n\n<style>\n${css}\n</style>`;
        }
        if (js) {
            content += `\n\n<script>\n${js}\n</script>`;
        }
        
        return { language: 'html', content: content.trim() };
    }
    
    const combinedContent = parts.map(part => 
        `/*--- ${part.language.toUpperCase()} ---*/\n\n${part.content}`
    ).join('\n\n');
    
    return { language: 'plaintext', content: combinedContent };
};

const CodeBlock: React.FC<CodeBlockProps> = ({ parts }) => {
  const [isCopied, setIsCopied] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  const isPreviewable = parts.some(p => PREVIEWABLE_LANGUAGES.includes(p.language.toLowerCase()));
  const [view, setView] = useState<'code' | 'preview'>(isPreviewable ? 'preview' : 'code');
  
  const unifiedCode = createUnifiedCodeString(parts);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(unifiedCode.content);
      setIsCopied(true);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  useEffect(() => {
    if (isCopied) {
      const timer = setTimeout(() => {
        setIsCopied(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isCopied]);
  
  const FullScreenPreview = () => (
    <div className="fixed inset-0 z-50 bg-gray-900 flex flex-col">
        <header className="flex-shrink-0 bg-gray-800 p-2 flex justify-end">
            <button
                onClick={() => setIsFullScreen(false)}
                className="flex items-center text-gray-400 hover:text-white transition-colors duration-200 p-2 rounded-md bg-gray-700 hover:bg-gray-600 btn-tactile"
                aria-label="Exit full screen"
            >
                <ExitFullScreenIcon className="w-5 h-5 mr-2" />
                <span>Exit Full Screen</span>
            </button>
        </header>
        <div className="flex-grow bg-white">
            <iframe
                srcDoc={createCombinedHtmlForPreview(parts)}
                title="Full Screen Code Preview"
                sandbox="allow-scripts allow-modals"
                className="w-full h-full border-0"
                loading="lazy"
            />
        </div>
    </div>
  );

  return (
    <>
      <div className="bg-gray-800 rounded-lg my-4 overflow-hidden border border-gray-700">
        <div className="flex justify-between items-center px-4 py-2 bg-gray-700 flex-wrap gap-2">
          <div className="flex items-center space-x-4">
              <div className="flex items-center gap-2">
                  {parts.map((part, index) => (
                      <span key={index} className="text-gray-400 text-xs font-mono uppercase bg-gray-900 px-2 py-1 rounded-md">{part.language || 'code'}</span>
                  ))}
              </div>
              {isPreviewable && (
                  <div className="flex items-center rounded-md bg-gray-900 p-1">
                      <button onClick={() => setView('code')} className={`px-2 py-1 text-xs rounded-md flex items-center transition-colors ${view === 'code' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-600'}`}>
                          <CodeIcon className="w-4 h-4 mr-1"/> Code
                      </button>
                      <button onClick={() => setView('preview')} className={`px-2 py-1 text-xs rounded-md flex items-center transition-colors ${view === 'preview' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-600'}`}>
                          <PreviewIcon className="w-4 h-4 mr-1"/> Preview
                      </button>
                  </div>
              )}
          </div>
          <div className="flex items-center gap-4">
            {view === 'preview' && isPreviewable && (
                <button
                    onClick={() => setIsFullScreen(true)}
                    className="flex items-center text-gray-400 hover:text-white transition-colors duration-200 btn-tactile"
                    aria-label="Enter full screen"
                >
                    <FullScreenIcon className="w-4 h-4" />
                </button>
            )}
            <button
              onClick={handleCopy}
              className="flex items-center text-gray-400 hover:text-white transition-colors duration-200 btn-tactile"
            >
              {isCopied ? (
                <>
                  <CheckIcon className="w-4 h-4 mr-1 text-green-400" />
                  <span className="text-sm">Copied!</span>
                </>
              ) : (
                <>
                  <CopyIcon className="w-4 h-4 mr-1" />
                  <span className="text-sm">Copy</span>
                </>
              )}
            </button>
          </div>
        </div>
        {(view === 'code' || !isPreviewable) ? (
          <div className="overflow-x-auto text-sm bg-gray-900">
              <pre className="p-4">
                  <code className={`language-${unifiedCode.language}`}>
                      {unifiedCode.content}
                  </code>
              </pre>
          </div>
        ) : (
          <div className="bg-white">
              <iframe
                  srcDoc={createCombinedHtmlForPreview(parts)}
                  title="Code Preview"
                  sandbox="allow-scripts allow-modals"
                  className="w-full h-[30rem] border-0"
                  loading="lazy"
              />
          </div>
        )}
      </div>
      {isFullScreen && <FullScreenPreview />}
    </>
  );
};

export default CodeBlock;