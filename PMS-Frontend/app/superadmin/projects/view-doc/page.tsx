'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  FileText, 
  Download, 
  Printer, 
  ArrowLeft, 
  Loader2, 
  ExternalLink,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Save
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

export default function DocumentViewerPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { token } = useAuthStore();
  const docId = searchParams.get('id');

  const [loading, setLoading] = useState(true);
  const [docUrl, setDocUrl] = useState('');
  const [docName, setDocName] = useState('');
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [docxBlob, setDocxBlob] = useState<Blob | null>(null);
  const [htmlContent, setHtmlContent] = useState('');
  const [textContent, setTextContent] = useState('');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!token || !docId) return;

    const fetchDocument = async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/documents/download/${docId}?inline=true`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setDocUrl(res.data.url);
        setDocName(res.data.filename);

        const lowerName = res.data.filename.toLowerCase();
        if (lowerName.endsWith('.docx')) {
           const blobRes = await axios.get(res.data.url, { responseType: 'blob' });
           setDocxBlob(blobRes.data);
        } else if (lowerName.endsWith('.html') || lowerName.endsWith('.htm')) {
           const textRes = await axios.get(res.data.url, { responseType: 'text' });
           setHtmlContent(textRes.data);
        } else if (lowerName.endsWith('.csv') || lowerName.endsWith('.txt') || lowerName.endsWith('.md')) {
           const textRes = await axios.get(res.data.url, { responseType: 'text' });
           setTextContent(textRes.data);
        }
      } catch (error: any) {
        console.error(error);
        toast.error('Failed to load the document. It may have been deleted or access is denied.');
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [token, docId]);

  if (!docId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-6">
        <FileText className="h-16 w-16 text-red-400 mb-4 animate-bounce" />
        <h1 className="text-2xl font-black uppercase tracking-wider">Invalid Access</h1>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-2">No document ID was provided in the URL</p>
        <Button onClick={() => window.close()} className="mt-8 bg-slate-800 hover:bg-slate-700 font-bold uppercase text-[10px] tracking-widest px-6 h-10 rounded-xl">
          Close Window
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-6">
        <Loader2 className="h-12 w-12 text-indigo-500 animate-spin mb-4" />
        <h1 className="text-xs font-black uppercase tracking-widest text-slate-400">Securing Link & Fetching File...</h1>
      </div>
    );
  }

  if (!docUrl) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-6">
        <FileText className="h-16 w-16 text-slate-600 mb-4" />
        <h1 className="text-xl font-black uppercase tracking-wider">File Not Found</h1>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-2">Could not retrieve the attachment details</p>
        <Button onClick={() => window.close()} className="mt-8 bg-slate-800 hover:bg-slate-700 font-bold uppercase text-[10px] tracking-widest px-6 h-10 rounded-xl">
          Close Window
        </Button>
      </div>
    );
  }

  const isPdf = docName.toLowerCase().endsWith('.pdf');
  const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(docName);
  const isDocx = docName.toLowerCase().endsWith('.docx');
  const isHtml = docName.toLowerCase().endsWith('.html') || docName.toLowerCase().endsWith('.htm');
  const isCsv = docName.toLowerCase().endsWith('.csv');
  const isTxt = docName.toLowerCase().endsWith('.txt') || docName.toLowerCase().endsWith('.md');

  const docxRef = (node: HTMLDivElement | null) => {
    if (node && docxBlob) {
      import('docx-preview').then(docx => {
        docx.renderAsync(docxBlob, node).catch(e => console.error(e));
      });
    }
  };

  const handleSaveFilledForm = () => {
    if (!iframeRef.current || !iframeRef.current.contentDocument) return;
    const container = iframeRef.current.contentDocument;
    
    const inputs = container.querySelectorAll('input');
    inputs.forEach(input => {
      if (input.type === 'checkbox' || input.type === 'radio') {
        if (input.checked) input.setAttribute('checked', 'checked');
        else input.removeAttribute('checked');
      } else {
        input.setAttribute('value', input.value);
      }
    });

    const selects = container.querySelectorAll('select');
    selects.forEach(select => {
      const options = select.querySelectorAll('option');
      options.forEach(option => {
        if (option.selected) option.setAttribute('selected', 'selected');
        else option.removeAttribute('selected');
      });
    });

    const textareas = container.querySelectorAll('textarea');
    textareas.forEach(ta => {
      ta.textContent = ta.value;
    });

    const updatedHtml = container.documentElement.outerHTML;
    const blob = new Blob([updatedHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const parts = docName.split('.');
    const ext = parts.pop();
    a.download = `${parts.join('.')}_filled.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Filled form downloaded successfully!');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/documents/download/${docId}?inline=false`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const a = document.createElement('a');
      a.href = res.data.url || res.request?.responseURL || docUrl;
      a.download = docName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      toast.error('Failed to trigger download');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col overflow-x-hidden text-slate-200 select-none">
      <style jsx global>{`
        @media print {
          body, html {
            background: white !important;
            color: black !important;
            height: 100% !important;
            overflow: visible !important;
          }
          .no-print {
            display: none !important;
          }
          .print-container {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            display: flex !important;
            justify-content: center !important;
            align-items: center !important;
          }
          .print-container img {
            max-width: 100% !important;
            height: auto !important;
            display: block !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
          }
          .print-container iframe, .print-container object {
            width: 100vw !important;
            height: 100vh !important;
            border: none !important;
          }
        }
      `}</style>

      <header className="no-print bg-slate-900 border-b border-slate-800 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 sticky top-0 z-50 shadow-xl">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <Button 
            onClick={() => window.close()} 
            variant="ghost" 
            className="text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl px-3 h-10 flex items-center gap-2 border border-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Close</span>
          </Button>
          <div className="flex flex-col">
            <h2 className="text-sm font-black tracking-tight text-white max-w-[280px] md:max-w-[400px] truncate" title={docName}>
              {docName}
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge className="bg-indigo-950 text-indigo-400 border border-indigo-900 text-[8px] font-black uppercase tracking-widest px-2 py-0.5">
                Secure Viewer
              </Badge>
              <span className="text-slate-600 text-xs font-bold">•</span>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                {isPdf ? 'PDF Document' : isImage ? 'Image File' : isDocx ? 'Word Document' : isHtml ? 'HTML Interactive Form' : isCsv ? 'CSV Spreadsheet' : isTxt ? 'Text Document' : 'Attachment File'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          {isImage && (
            <div className="flex items-center gap-1.5 bg-slate-950/60 rounded-xl px-2 py-1 border border-slate-800">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setZoom(z => Math.max(z - 25, 50))} 
                className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-[10px] font-bold font-mono text-slate-400 w-10 text-center">{zoom}%</span>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setZoom(z => Math.min(z + 25, 300))} 
                className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setRotation(r => (r + 90) % 360)} 
                className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg border-l border-slate-800 pl-1.5 ml-1"
                title="Rotate Image"
              >
                <RotateCw className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}

          <div className="flex items-center gap-2">
            {isHtml && (
              <Button 
                onClick={handleSaveFilledForm}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-10 px-5 font-black text-[10px] uppercase tracking-widest transition-all shadow-md flex items-center gap-2"
              >
                <Save className="h-3.5 w-3.5" />
                Save Filled Form
              </Button>
            )}
            <Button 
              onClick={handlePrint} 
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-10 px-5 font-black text-[10px] uppercase tracking-widest transition-all shadow-md hover:shadow-indigo-500/10 flex items-center gap-2"
            >
              <Printer className="h-3.5 w-3.5" />
              Print / Save as PDF
            </Button>
            <Button 
              onClick={handleDownload} 
              variant="outline"
              className="border-slate-800 hover:border-slate-700 bg-slate-950 text-slate-300 hover:text-white hover:bg-slate-900 rounded-xl h-10 px-5 font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2"
            >
              <Download className="h-3.5 w-3.5" />
              Download Original
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 md:p-8 bg-slate-950 overflow-y-auto">
        <div className="print-container w-full max-w-5xl flex justify-center items-center">
          {isPdf ? (
            <Card className="w-full bg-slate-900 border-slate-800 overflow-hidden shadow-2xl rounded-2xl no-print">
              <iframe 
                src={`${docUrl}#toolbar=0`} 
                className="w-full h-[82vh] border-0"
                title={docName}
              />
            </Card>
          ) : isDocx ? (
            <Card className="w-full bg-white text-black overflow-hidden shadow-2xl rounded-2xl min-h-[82vh] p-8 no-print">
               <div ref={docxRef} className="w-full h-full overflow-y-auto" />
            </Card>
          ) : isHtml ? (
            <Card className="w-full bg-white text-black overflow-hidden shadow-2xl rounded-2xl min-h-[82vh] no-print relative">
               <iframe ref={iframeRef} srcDoc={htmlContent} className="w-full h-[82vh] border-0" title={docName} />
            </Card>
          ) : isImage ? (
            <div className="flex flex-col items-center justify-center p-4">
              <div 
                className="transition-all duration-300 ease-out" 
                style={{ 
                  transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                  transformOrigin: 'center center'
                }}
              >
                <img 
                  src={docUrl} 
                  alt={docName}
                  className="max-h-[75vh] object-contain rounded-2xl shadow-2xl border border-slate-800 bg-slate-900"
                />
              </div>
              <p className="no-print mt-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Scroll to zoom in/out or rotate using the toolbar controls
              </p>
            </div>
          ) : isCsv ? (
            <Card className="w-full bg-white text-black overflow-hidden shadow-2xl rounded-2xl min-h-[82vh] p-8 no-print overflow-x-auto">
               <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                 <thead>
                   <tr>
                     {textContent.split('\n')[0]?.split(',').map((header, i) => (
                       <th key={i} className="border-b-2 border-slate-200 p-3 font-black bg-slate-50 uppercase tracking-wider text-[10px] text-slate-500">{header}</th>
                     ))}
                   </tr>
                 </thead>
                 <tbody>
                   {textContent.split('\n').slice(1).map((row, i) => {
                     if (!row.trim()) return null;
                     return (
                       <tr key={i} className="hover:bg-slate-50/50 border-b border-slate-100 transition-colors">
                         {row.split(',').map((cell, j) => (
                           <td key={j} className="p-3 border-r border-slate-50 last:border-0 font-medium text-slate-700">{cell}</td>
                         ))}
                       </tr>
                     );
                   })}
                 </tbody>
               </table>
            </Card>
          ) : isTxt ? (
            <Card className="w-full bg-slate-900 border-slate-800 text-slate-300 overflow-hidden shadow-2xl rounded-2xl min-h-[82vh] p-8 no-print">
               <pre className="w-full h-full overflow-auto whitespace-pre-wrap font-mono text-sm leading-relaxed">{textContent}</pre>
            </Card>
          ) : (
            <Card className="bg-slate-900 border-slate-800 p-12 text-center rounded-2xl max-w-md w-full shadow-2xl">
              <FileText className="h-16 w-16 text-indigo-500 mx-auto mb-6" />
              <h3 className="text-lg font-black text-white uppercase tracking-wider">{docName.split('.').pop()?.toUpperCase()} File</h3>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest mt-2 leading-relaxed">
                This file format cannot be previewed directly inside the browser.
              </p>
              <div className="mt-8 flex flex-col gap-3">
                <Button 
                  onClick={handleDownload}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-11 w-full font-black text-[10px] uppercase tracking-widest shadow-lg"
                >
                  <Download className="mr-2 h-4 w-4" /> Download & View Original
                </Button>
                <Button 
                  onClick={() => window.open(docUrl, '_blank')}
                  variant="outline"
                  className="border-slate-800 hover:border-slate-700 bg-slate-950 text-slate-300 rounded-xl h-11 w-full font-black text-[10px] uppercase tracking-widest"
                >
                  <ExternalLink className="mr-2 h-4 w-4" /> Open In Native Tab
                </Button>
              </div>
            </Card>
          )}
        </div>

        {isPdf && (
          <div className="hidden print:block w-full h-full">
            <object 
              data={docUrl} 
              type="application/pdf" 
              className="w-full h-screen border-none"
            >
              <iframe src={docUrl} className="w-full h-screen border-none" />
            </object>
          </div>
        )}
      </main>
    </div>
  );
}
