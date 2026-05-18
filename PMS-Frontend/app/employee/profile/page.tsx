'use client';

import { motion } from 'motion/react';
import { 
  User, 
  Mail, 
  Building2, 
  ShieldCheck, 
  Smartphone, 
  Edit, 
  Lock,
  CloudLightning
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/authStore';
import { Badge } from '@/components/ui/badge';

export default function EmployeeProfilePage() {
  const { user } = useAuthStore();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
         <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase leading-none">Identity Core</h2>
         <p className="text-slate-500 font-medium text-sm mt-2">Personal parameters within the synchronization network</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
         {/* Profile Card */}
         <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="md:col-span-4">
            <Card className="rounded-3xl border-slate-200 shadow-sm overflow-hidden bg-white h-full flex flex-col">
               <div className="h-24 bg-slate-900 relative">
                  <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 p-2 bg-white rounded-3xl shadow-xl">
                     <div className="w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center font-black text-2xl text-white shadow-inner">
                        {user?.full_name?.charAt(0) || 'E'}
                     </div>
                  </div>
               </div>
               <div className="pt-16 pb-8 px-8 text-center flex-1">
                  <h3 className="text-xl font-black text-slate-900 uppercase truncate">{user?.full_name}</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1 mb-6">Resource Node</p>
                  
                  <div className="space-y-3">
                     <Badge className="w-full justify-center bg-indigo-50 text-indigo-600 border-none py-2 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-100 cursor-default">
                        {user?.designation || 'Software Engineer'}
                     </Badge>
                     <Badge className="w-full justify-center bg-slate-50 text-slate-500 border-none py-2 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-100 cursor-default">
                        {user?.role || 'Product Engineering'}
                     </Badge>
                  </div>
               </div>
               <div className="p-6 bg-slate-50 border-t border-slate-100 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Status: Fully Synchronized</span>
               </div>
            </Card>
         </motion.div>

         {/* Settings & Details */}
         <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="md:col-span-8 space-y-6">
            <Card className="rounded-3xl border-slate-200 shadow-sm p-8 bg-white">
               <div className="flex items-center justify-between mb-8">
                  <h4 className="text-sm font-black uppercase tracking-tight text-slate-800">Account Parameters</h4>
                  <Button variant="outline" size="sm" className="rounded-xl h-9 border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-500">
                     <Edit className="mr-2 h-3 w-3" /> Update Metadata
                  </Button>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center">
                        <User className="h-3 w-3 mr-2 text-indigo-500" /> Full Identity
                     </Label>
                     <Input readOnly value={user?.full_name} className="h-11 rounded-xl bg-slate-50 border-slate-100 font-bold text-xs" />
                  </div>
                  <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center">
                        <Mail className="h-3 w-3 mr-2 text-indigo-500" /> Relay Endpoint
                     </Label>
                     <Input readOnly value={user?.email} className="h-11 rounded-xl bg-slate-50 border-slate-100 font-bold text-xs" />
                  </div>
                  <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center">
                        <Smartphone className="h-3 w-3 mr-2 text-indigo-500" /> Mobile Uplink
                     </Label>
                     <Input readOnly value="+1 (555) 000-0000" className="h-11 rounded-xl bg-slate-50 border-slate-100 font-bold text-xs" />
                  </div>
                  <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center">
                        <Building2 className="h-3 w-3 mr-2 text-indigo-500" /> Operational Unit
                     </Label>
                     <Input readOnly value={user?.role || 'Design Unit'} className="h-11 rounded-xl bg-slate-50 border-slate-100 font-bold text-xs" />
                  </div>
               </div>
            </Card>

            <Card className="rounded-3xl border-slate-200 shadow-sm p-8 bg-white border-l-4 border-l-indigo-600">
               <div className="flex items-start justify-between">
                  <div className="space-y-1">
                     <h4 className="text-sm font-black uppercase tracking-tight text-slate-800">Security Credentials</h4>
                     <p className="text-[10px] font-medium text-slate-400 italic">Last password reset: 42 days ago</p>
                  </div>
                  <Button className="rounded-xl h-10 px-6 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] uppercase tracking-widest group">
                     <Lock className="mr-2 h-3 w-3 group-hover:scale-110 transition-transform" /> Rotate Key
                  </Button>
               </div>
            </Card>

            <Card className="rounded-3xl border-slate-200 shadow-sm p-8 bg-indigo-50 relative overflow-hidden group">
               <CloudLightning className="absolute -right-8 -bottom-8 h-32 w-32 text-indigo-100 group-hover:scale-110 transition-transform duration-500" />
               <div className="relative z-10 space-y-4">
                  <h4 className="text-sm font-black uppercase tracking-tight text-indigo-900">Resource Sync Metrics</h4>
                  <div className="flex items-center space-x-8">
                     <div>
                        <span className="text-[9px] font-black uppercase text-indigo-400 block mb-1">Total Logs</span>
                        <span className="text-2xl font-black text-indigo-900">412</span>
                     </div>
                     <div className="w-px h-8 bg-indigo-200"></div>
                     <div>
                        <span className="text-[9px] font-black uppercase text-indigo-400 block mb-1">Efficiency</span>
                        <span className="text-2xl font-black text-indigo-900">92%</span>
                     </div>
                  </div>
               </div>
            </Card>
         </motion.div>
      </div>
    </div>
  );
}
