'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  Loader2, 
  ExternalLink,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Save,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import api from '@/services/api';
import { useAuthStore } from '@/store/authStore';

export interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  docId: number | string | null;
  docType: 'project' | 'timesheet';
}

export function DocumentViewerModal({ isOpen, onClose, docId, docType }: DocumentViewerModalProps) {
  const { token } = useAuthStore();
  
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
    if (!isOpen || !docId) return;

    let activeToken = token;
    if (!activeToken && typeof document !== 'undefined') {
      const match = document.cookie.match(/(?:^|;)\s*auth_token=([^;]+)/);
      if (match) activeToken = match[1];
    }
    
    if (!activeToken) return;

    const fetchDocument = async () => {
      try {
        setLoading(true);
        const endpoint = docType === 'timesheet' 
          ? `/timesheets/download-attachment/${docId}?inline=true`
          : `/documents/download/${docId}?inline=true`;
          
        const res = await api.get(endpoint);
        setDocUrl(res.data.url);
        setDocName(res.data.filename);

        const lowerName = res.data.filename.toLowerCase();
        if (lowerName.endsWith('.docx')) {
           const blobRes = await fetch(res.data.url).then(r => r.blob());
           setDocxBlob(blobRes);
        } else if (lowerName.endsWith('.html') || lowerName.endsWith('.htm')) {
           const textRes = await fetch(res.data.url).then(r => r.text());
           setHtmlContent(textRes);
        } else if (lowerName.endsWith('.csv') || lowerName.endsWith('.txt') || lowerName.endsWith('.md')) {
           const textRes = await fetch(res.data.url).then(r => r.text());
           setTextContent(textRes);
        }
      } catch (error: any) {
        console.error(error);
        toast.error('Failed to load the document. It may have been deleted or access is denied.');
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [isOpen, docId, docType, token]);

  const resetState = () => {
    setLoading(true);
    setDocUrl('');
    setDocName('');
    setZoom(100);
    setRotation(0);
    setDocxBlob(null);
    setHtmlContent('');
    setTextContent('');
  };

  const handleClose = () => {
    onClose();
    setTimeout(resetState, 300);
  };

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
    if (isPdf) {
      window.open(docUrl, '_blank');
      return;
    }
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Popup blocked. Please allow popups to print.');
      return;
    }

    let printContent = '';

    if (isImage) {
      printContent = `<div style="display:flex;justify-content:center;"><img src="${docUrl}" style="max-width: 100%; max-height: 100vh;" /></div>`;
    } else if (isDocx) {
      printContent = document.querySelector('.docx-wrapper')?.innerHTML || '';
    } else if (isHtml && iframeRef.current?.contentDocument) {
      printContent = iframeRef.current.contentDocument.documentElement.outerHTML;
    } else if (isCsv) {
      const rows = textContent.split('\n').filter(r => r.trim());
      const header = rows[0]?.split(',') || [];
      const body = rows.slice(1);
      printContent = '<table><thead><tr>' + header.map(h => `<th>${h}</th>`).join('') + '</tr></thead><tbody>' + 
        body.map(r => `<tr>${r.split(',').map(c => `<td>${c}</td>`).join('')}</tr>`).join('') + '</tbody></table>';
    } else if (isTxt) {
      printContent = `<pre>${textContent}</pre>`;
    } else {
      printWindow.close();
      window.open(docUrl, '_blank');
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Print - ${docName}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; padding: 20px; color: black; background: white; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f4f4f5; font-weight: bold; }
            pre { white-space: pre-wrap; font-family: monospace; font-size: 14px; }
            @media print {
              @page { margin: 1cm; }
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          ${printContent}
          <script>
            window.onload = () => {
              setTimeout(() => {
                window.print();
                window.close();
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownload = async () => {
    try {
      const endpoint = docType === 'timesheet' 
        ? `/timesheets/download-attachment/${docId}?as_json=true&inline=false`
        : `/documents/download/${docId}?as_json=true&inline=false`;
        
      const res = await api.get(endpoint);
      const a = document.createElement('a');
      a.href = res.data.url;
      a.download = docName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      toast.error('Failed to trigger download');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-[95vw] sm:max-w-[95vw] w-[1400px] h-[95vh] p-0 flex flex-col gap-0 border-none rounded-2xl overflow-hidden shadow-2xl bg-background">
        <DialogTitle className="sr-only">Document Viewer</DialogTitle>
        
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-card text-foreground p-6">
            <Loader2 className="h-12 w-12 text-indigo-500 animate-spin mb-4" />
            <h1 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Securing Link & Fetching File...</h1>
          </div>
        ) : !docUrl ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-card text-foreground p-6">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <h1 className="text-xl font-black uppercase tracking-wider">File Not Found</h1>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mt-2">Could not retrieve the attachment details</p>
            <Button onClick={handleClose} className="mt-8 bg-muted hover:bg-muted/80 font-bold uppercase text-[10px] tracking-widest px-6 h-10 rounded-xl text-foreground">
              Close Viewer
            </Button>
          </div>
        ) : (
          <>
            <header className="bg-card border-b border-border px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 sticky top-0 z-50 shadow-sm shrink-0">
              <div className="flex items-center gap-4 w-full md:w-auto">
                <Button 
                  onClick={handleClose} 
                  variant="ghost" 
                  className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl px-3 h-10 flex items-center gap-2 border border-border"
                >
                  <X className="h-4 w-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Close</span>
                </Button>
                <div className="flex flex-col">
                  <h2 className="text-sm font-black tracking-tight text-foreground max-w-[280px] md:max-w-[400px] truncate" title={docName}>
                    {docName}
                  </h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge className="bg-primary/10 text-primary border border-primary/20 text-[8px] font-black uppercase tracking-widest px-2 py-0.5">
                      Secure Viewer
                    </Badge>
                    <span className="text-muted-foreground text-xs font-bold">•</span>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                      {isPdf ? 'PDF Document' : isImage ? 'Image File' : isDocx ? 'Word Document' : isHtml ? 'HTML Interactive Form' : isCsv ? 'CSV Spreadsheet' : isTxt ? 'Text Document' : 'Attachment File'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                {isImage && (
                  <div className="flex items-center gap-1.5 bg-background/60 rounded-xl px-2 py-1 border border-border">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setZoom(z => Math.max(z - 25, 50))} 
                      className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg"
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <span className="text-[10px] font-bold font-mono text-muted-foreground w-10 text-center">{zoom}%</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setZoom(z => Math.min(z + 25, 300))} 
                      className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg"
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setRotation(r => (r + 90) % 360)} 
                      className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg border-l border-border pl-1.5 ml-1"
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
                      className="bg-emerald-600 hover:bg-emerald-700 text-foreground rounded-xl h-10 px-5 font-black text-[10px] uppercase tracking-widest transition-all shadow-md flex items-center gap-2"
                    >
                      <Save className="h-3.5 w-3.5" />
                      Save Filled Form
                    </Button>
                  )}
                  <Button 
                    onClick={handlePrint} 
                    className="bg-primary hover:bg-indigo-700 text-foreground rounded-xl h-10 px-5 font-black text-[10px] uppercase tracking-widest transition-all shadow-md hover:shadow-indigo-500/10 flex items-center gap-2"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    Open for Print
                  </Button>
                  <Button 
                    onClick={handleDownload} 
                    variant="outline"
                    className="border-border hover:border-border bg-background text-foreground/80 hover:text-foreground hover:bg-card rounded-xl h-10 px-5 font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download Original
                  </Button>
                </div>
              </div>
            </header>

            <main className="flex-1 flex items-start justify-center p-4 md:p-8 bg-background overflow-y-auto">
              <div className="w-full max-w-5xl min-h-full flex justify-center items-start">
                {isPdf ? (
                  <Card className="w-full h-full bg-card border-border overflow-hidden shadow-2xl rounded-xl">
                    <iframe 
                      src={`${docUrl}#toolbar=0`} 
                      className="w-full h-full border-0 min-h-[75vh]"
                      title={docName}
                    />
                  </Card>
                ) : isDocx ? (
                  <Card className="w-full bg-background text-black overflow-hidden shadow-2xl rounded-xl min-h-[75vh] p-8">
                     <div ref={docxRef} className="w-full h-full overflow-y-auto" />
                  </Card>
                ) : isHtml ? (
                  <Card className="w-full bg-background text-black overflow-hidden shadow-2xl rounded-xl min-h-[75vh] relative">
                     <iframe ref={iframeRef} srcDoc={htmlContent} className="w-full h-full border-0 min-h-[75vh]" title={docName} />
                  </Card>
                ) : isImage ? (
                  <div className="flex flex-col items-center justify-center p-4 h-full">
                    <div 
                      className="transition-all duration-300 ease-out flex items-center justify-center h-full" 
                      style={{ 
                        transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                        transformOrigin: 'center center'
                      }}
                    >
                      <img 
                        src={docUrl} 
                        alt={docName}
                        className="max-h-[75vh] object-contain rounded-xl shadow-2xl border border-border bg-card"
                      />
                    </div>
                  </div>
                ) : isCsv ? (
                  <Card className="w-full bg-background text-black overflow-hidden shadow-2xl rounded-xl min-h-[75vh] p-8 overflow-x-auto">
                     <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                       <thead>
                         <tr className="bg-muted/50 h-10">
                           {textContent.split('\n')[0]?.split(',').map((header, i) => (
                             <th key={i} className="border-b border-border px-4 font-medium text-xs text-muted-foreground">{header}</th>
                           ))}
                         </tr>
                       </thead>
                       <tbody>
                         {textContent.split('\n').slice(1).map((row, i) => {
                           if (!row.trim()) return null;
                           return (
                             <tr key={i} className="hover:bg-muted/50 border-b border-border transition-colors h-14">
                               {row.split(',').map((cell, j) => (
                                 <td key={j} className="px-4 align-middle text-sm text-muted-foreground">{cell}</td>
                               ))}
                             </tr>
                           );
                         })}
                       </tbody>
                     </table>
                  </Card>
                ) : isTxt ? (
                  <Card className="w-full bg-card border-border text-foreground/80 overflow-hidden shadow-2xl rounded-xl min-h-[75vh] p-8">
                     <pre className="w-full h-full overflow-auto whitespace-pre-wrap font-mono text-sm leading-relaxed">{textContent}</pre>
                  </Card>
                ) : (
                  <Card className="bg-card border-border p-12 text-center rounded-xl max-w-md w-full shadow-2xl mx-auto">
                    <FileText className="h-16 w-16 text-indigo-500 mx-auto mb-6" />
                    <h3 className="text-lg font-black text-foreground uppercase tracking-wider">{docName.split('.').pop()?.toUpperCase()} File</h3>
                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-widest mt-2 leading-relaxed">
                      This file format cannot be previewed directly inside the browser.
                    </p>
                    <div className="mt-8 flex flex-col gap-3">
                      <Button 
                        onClick={handleDownload}
                        className="bg-primary hover:bg-indigo-700 text-foreground rounded-xl h-11 w-full font-black text-[10px] uppercase tracking-widest shadow-lg"
                      >
                        <Download className="mr-2 h-4 w-4" /> Download & View Original
                      </Button>
                      <Button 
                        onClick={() => window.open(docUrl, '_blank')}
                        variant="outline"
                        className="border-border hover:border-border bg-background text-foreground/80 hover:bg-muted rounded-xl h-11 w-full font-black text-[10px] uppercase tracking-widest"
                      >
                        <ExternalLink className="mr-2 h-4 w-4" /> Open In Native Tab
                      </Button>
                    </div>
                  </Card>
                )}
              </div>
            </main>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
