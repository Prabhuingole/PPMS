'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import axios from 'axios';
import { 
  ArrowLeft, 
  Printer, 
  Loader2, 
  Save, 
  FileText 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { DocumentTemplate } from '@/types';

export default function FillHTMLTemplatePage() {
  const { doc_type } = useParams();
  const { token } = useAuthStore();
  const router = useRouter();
  
  const [template, setTemplate] = useState<DocumentTemplate | null>(null);
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token || !doc_type) return;

    const fetchTemplateAndHTML = async () => {
      try {
        // Fetch Template Metadata
        const typeStr = Array.isArray(doc_type) ? doc_type[0] : doc_type;
        const decodedType = decodeURIComponent(typeStr);
        
        const tmplRes = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/templates/${encodeURIComponent(decodedType)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        const tmplData = tmplRes.data;
        setTemplate(tmplData);

        if (!tmplData.filename || !tmplData.filename.toLowerCase().endsWith('.html')) {
          toast.error("This template does not contain a valid HTML form.");
          setIsLoading(false);
          return;
        }

        // Fetch HTML content from S3 / Download URL
        const downloadRes = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/templates/download/${encodeURIComponent(decodedType)}?inline=true`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const htmlUrl = downloadRes.data.url;
        
        // Fetch the raw HTML text
        const htmlRes = await axios.get(htmlUrl);
        setHtmlContent(htmlRes.data);

      } catch (error) {
        console.error('Error fetching HTML form:', error);
        toast.error('Failed to load HTML form template');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTemplateAndHTML();
  }, [token, doc_type]);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mb-4" />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Loading Interactive Form...</p>
      </div>
    );
  }

  if (!template || !htmlContent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="p-6 bg-red-50 rounded-full text-red-600">
          <FileText className="h-12 w-12" />
        </div>
        <p className="text-slate-700 font-black uppercase tracking-widest text-sm">Form Not Available</p>
        <Button onClick={() => router.back()} variant="outline" className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-slate-50 overflow-y-auto flex flex-col print:static print:h-auto print:bg-white print:block">
      {/* Background ambient design */}
      <div className="fixed inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none mix-blend-multiply print:hidden"></div>
      <div className="fixed top-0 right-0 -translate-y-12 translate-x-1/3 w-[800px] h-[400px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none print:hidden"></div>
      <div className="fixed bottom-0 left-0 translate-y-1/3 -translate-x-1/4 w-[600px] h-[600px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none print:hidden"></div>

      {/* Main Form Content - Will be printed */}
      <div className="flex-grow flex items-start justify-center p-4 sm:p-8 md:p-12 print:p-0 relative z-10">
        <div className="bg-white rounded-[40px] print:rounded-none shadow-2xl shadow-slate-200/50 w-full max-w-5xl min-h-[800px] p-8 sm:p-12 md:p-16 print:p-0 relative overflow-hidden group/paper transition-all">
          
          {/* Subtle Paper Texture Gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-50/20 to-transparent pointer-events-none print:hidden"></div>

          {/* Elegant header separator on print or screen */}
          <div className="hidden print:block border-b-2 border-slate-900 pb-4 mb-8">
             <h2 className="text-xl font-black uppercase tracking-tight text-slate-900">{template.doc_type}</h2>
             <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Official Document Render</p>
          </div>
          
          {/* Inject raw HTML inside a form tag so reset buttons work */}
          <form 
            className="relative z-10 max-w-none w-full
                       /* We only add minimal focus/outline styles so inputs are accessible, but we do NOT override backgrounds or borders */
                       [&_input]:transition-all [&_input:focus]:outline-none [&_input:focus]:ring-2 [&_input:focus]:ring-indigo-500/20
                       [&_textarea]:transition-all [&_textarea:focus]:outline-none [&_textarea:focus]:ring-2 [&_textarea:focus]:ring-indigo-500/20
                       
                       /* Print Modifiers to hide buttons */
                       print:[&_button]:hidden"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        </div>
      </div>
    </div>
  );
}
