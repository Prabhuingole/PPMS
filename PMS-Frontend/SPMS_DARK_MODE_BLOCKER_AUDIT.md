# SPMS Dark Mode Blocker Audit

This report identifies potential blockers for dark mode implementation.

## Summary

- **Total Potential Blockers:** 241

## Detailed Findings

### `components/audit/AuditLogFeed.tsx`
- **Line 224** (`text-white`): `<div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[9px] font-bold text-white shrink-0">`

### `components/employee/AttendanceCalendar.tsx`
- **Line 67** (`text-white`): `case 'green': return 'bg-emerald-500 text-white ring-emerald-400/30';`
- **Line 68** (`text-white`): `case 'yellow': return 'bg-amber-400 text-white ring-amber-400/30';`
- **Line 69** (`text-white`): `case 'orange': return 'bg-orange-500 text-white ring-orange-400/30';`

### `components/employee/AttendanceDetailModal.tsx`
- **Line 71** (`bg-black`): `<div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">`

### `components/employee/AttendanceWidget.tsx`
- **Line 132** (`text-white`): `className="w-full bg-red-600 hover:bg-red-700 text-white rounded-xl h-10 font-bold text-xs uppercase tracking-widest shadow-lg shadow-red-600/20"`
- **Line 141** (`text-white`): `className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-12 font-bold text-xs uppercase tracking-widest shadow-lg shadow-emerald-600/20"`

### `components/employee/ClockInOutModal.tsx`
- **Line 84** (`bg-black`): `<div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">`
- **Line 110** (`text-white`): `<div className="absolute inset-0 flex items-center justify-center text-white text-sm font-medium p-6 text-center">`
- **Line 121** (`border-white`): `<div className="w-40 h-40 rounded-full border-2 border-dashed border-white/30" />`
- **Line 156** (`text-white`): `} text-white`}`
- **Line 160** (`border-white`): `<div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />`
- **Line 174** (`text-white`): `} text-white`}`

### `components/employee/Sidebar.tsx`
- **Line 41** (`bg-black`): `className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden transition-opacity"`
- **Line 59** (`border-white`): `"relative z-10 flex items-center gap-3 border-b border-white/5 transition-all",`
- **Line 63** (`text-white`): `<div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center font-black text-white text-xs shrink-0 shadow-lg shadow-indigo-500/25 ring-1 ring-white/10">`
- **Line 70** (`text-white`): `<span className="text-white font-black text-base tracking-tight truncate">`
- **Line 98** (`text-white`): `? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-600/20"`
- **Line 99** (`text-white`): `: "text-muted-foreground hover:text-white hover:bg-white/5"`
- **Line 108** (`text-white`): `isActive ? "text-white" : "text-muted-foreground group-hover:text-slate-300"`
- **Line 125** (`text-white`): `<div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-slate-800 text-white text-xs font-bold rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 whitespace-nowrap z-50 ring-1 ring-white/10">`
- **Line 136** (`border-white`): `<div className="relative z-10 p-3 mt-auto border-t border-white/5">`
- **Line 139** (`text-white`): `<div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[10px] text-white uppercase font-black shrink-0 shadow-sm ring-1 ring-white/10">`
- **Line 143** (`text-white`): `<span className="text-xs font-bold text-white truncate">`
- **Line 164** (`text-white`): `<div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[10px] text-white uppercase font-black shrink-0 ring-1 ring-white/10">`

### `components/employees/EmployeeForm.tsx`
- **Line 93** (`text-white`): `<div className="bg-slate-900 p-6 text-white relative overflow-hidden shrink-0">`
- **Line 98** (`text-white`): `<DialogTitle className="text-2xl font-black uppercase tracking-tight text-white">`
- **Line 262** (`rgba(`): `<DialogFooter className="p-4 border-t border-border bg-card shrink-0 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)] z-10">`
- **Line 277** (`text-white`): `className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg h-10 px-6 font-black uppercase tracking-widest text-[10px] shadow-sm transition-all"`

### `components/layout/Navbar.tsx`
- **Line 144** (`text-white`): `<span className="absolute top-0 right-0 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white border-2 border-white">`
- **Line 144** (`border-white`): `<span className="absolute top-0 right-0 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white border-2 border-white">`
- **Line 261** (`text-white`): `<AvatarFallback className="bg-slate-900 text-white font-bold text-xs">`

### `components/layout/Sidebar.tsx`
- **Line 51** (`bg-black`): `className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden transition-opacity"`
- **Line 69** (`border-white`): `"relative z-10 flex items-center gap-3 border-b border-white/5 transition-all",`
- **Line 73** (`text-white`): `<div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center font-black text-white text-xs shrink-0 shadow-lg shadow-indigo-500/25 ring-1 ring-white/10">`
- **Line 80** (`text-white`): `<span className="text-white font-black text-base tracking-tight truncate">`
- **Line 109** (`text-white`): `? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-600/20"`
- **Line 110** (`text-white`): `: "text-muted-foreground hover:text-white hover:bg-white/5"`
- **Line 119** (`text-white`): `isActive ? "text-white" : "text-muted-foreground group-hover:text-slate-300"`
- **Line 136** (`text-white`): `<div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-slate-800 text-white text-xs font-bold rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 whitespace-nowrap z-50 ring-1 ring-white/10">`
- **Line 147** (`border-white`): `<div className="relative z-10 p-3 mt-auto border-t border-white/5">`
- **Line 150** (`text-white`): `<div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[10px] text-white uppercase font-black shrink-0 shadow-sm ring-1 ring-white/10">`
- **Line 154** (`text-white`): `<span className="text-xs font-bold text-white truncate">`
- **Line 175** (`text-white`): `<div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[10px] text-white uppercase font-black shrink-0 ring-1 ring-white/10">`

### `components/timesheets/FillTimesheetDialog.tsx`
- **Line 387** (`rgba(`): `<DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-2xl md:max-w-3xl w-full max-h-[90vh] overflow-y-auto p-0 border border-border/60 bg-white/80 backdrop-blur-3xl flex flex-col rounded-xl sm:rounded-[32px] shadow-[0_20px_60px_-15px_rgba(79,70,229,0.15)]">`
- **Line 413** (`text-white`): `"flex items-center gap-2 px-4 py-2 rounded-xl shadow-lg text-white",`
- **Line 563** (`text-white`): `className="h-8 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[9px] font-black uppercase tracking-widest"`
- **Line 796** (`text-white`): `"h-10 px-8 text-white rounded-xl shadow-lg font-black uppercase text-xs tracking-widest transition-all group",`

### `components/ui/delete-confirmation-modal.tsx`
- **Line 34** (`rgba(`): `<DialogContent className="sm:max-w-[425px] p-0 overflow-hidden border-none shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] rounded-[2rem] bg-card">`
- **Line 35** (`text-white`): `<div className="bg-gradient-to-br from-red-600 to-rose-700 p-8 text-white relative overflow-hidden">`
- **Line 37** (`bg-black`): `<div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-xl"></div>`
- **Line 40** (`border-white`): `<div className="h-20 w-20 bg-white/10 rounded-[1.5rem] backdrop-blur-md flex items-center justify-center border border-white/20 shadow-2xl mb-4 relative">`
- **Line 42** (`border-white`): `<div className="absolute -top-2 -right-2 h-6 w-6 bg-red-500 rounded-full flex items-center justify-center shadow-lg border border-white/20">`
- **Line 43** (`text-white`): `<AlertTriangle className="h-3 w-3 text-white" />`
- **Line 45** (`text-white`): `<Trash2 className="h-10 w-10 text-white drop-shadow-md" />`
- **Line 48** (`text-white`): `<DialogTitle className="text-2xl font-black uppercase tracking-tight text-white mb-2">`
- **Line 79** (`text-white`): `className="w-full sm:w-1/2 h-14 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-red-200 transition-all hover:-translate-y-0.5 active:scale-95"`

### `components/ui/dialog.tsx`
- **Line 34** (`bg-black`): `"fixed inset-0 isolate z-50 bg-black/10 duration-100 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",`

### `components/ui/sheet.tsx`
- **Line 31** (`bg-black`): `"fixed inset-0 z-50 bg-black/10 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0 supports-backdrop-filter:backdrop-blur-xs",`

### `app/employee/attendance/page.tsx`
- **Line 122** (`text-white`): `className="bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg h-10 px-4 font-semibold text-sm"`
- **Line 129** (`text-white`): `className="bg-red-600 text-white hover:bg-red-700 rounded-lg h-10 px-4 font-semibold text-sm"`

### `app/employee/dashboard/page.tsx`
- **Line 127** (`text-white`): `className={cn(buttonVariants(), "bg-primary text-white hover:bg-indigo-700 rounded-xl h-12 px-6 shadow-xl shadow-indigo-600/20 font-bold uppercase text-xs tracking-widest")}`
- **Line 221** (`text-white`): `<Card className="rounded-xl border-none shadow-2xl shadow-purple-500/20 bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-600 p-4 md:p-6 text-white h-full flex flex-col relative overflow-hidden">`
- **Line 234** (`border-white`): `<div key={i} className="flex flex-col space-y-2 border-b border-white/20 pb-4">`
- **Line 242** (`text-white`): `<p className="text-sm text-white/90 font-bold mb-2">Failed to load recent activity</p>`
- **Line 243** (`text-white`): `<Button size="sm" variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20" onClick={fetchTimesheets}>Try Again</Button>`
- **Line 243** (`border-white`): `<Button size="sm" variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20" onClick={fetchTimesheets}>Try Again</Button>`
- **Line 246** (`text-white`): `<p className="text-sm text-white/70 font-medium">No submissions yet</p>`
- **Line 249** (`border-white`): `<div key={ts.id} className="flex items-start justify-between border-b border-white/20 last:border-0 pb-4 last:pb-0">`
- **Line 251** (`text-white`): `<span className="text-[10px] font-black text-white/70 uppercase tracking-widest mb-1">`
- **Line 254** (`text-white`): `<span className="text-xs font-bold text-white truncate">{ts.task_title || ts.project_name || 'Task'}</span>`
- **Line 255** (`text-white`): `<span className="text-[10px] text-white/90 font-bold">{formatDuration(ts.hours || 0)}</span>`
- **Line 258** (`text-white`): `<PopoverTrigger className="mt-2 flex items-start gap-1.5 text-left text-[9px] text-white bg-white/15 hover:bg-white/25 px-2.5 py-1.5 rounded-xl max-w-[200px] transition-colors focus:outline-none">`
- **Line 259** (`text-white`): `<MessageSquare className="h-3 w-3 text-white/80 mt-0.5 flex-shrink-0" />`
- **Line 280** (`text-white`): `ts.status === 'approved' ? "bg-emerald-400/30 text-white" :`
- **Line 281** (`text-white`): `ts.status === 'rejected' ? "bg-red-400/40 text-white" :`
- **Line 282** (`text-white`): `"bg-amber-400/30 text-white"`

### `app/employee/notes/page.tsx`
- **Line 168** (`text-white`): `? "bg-primary text-white shadow-md shadow-indigo-200"`
- **Line 195** (`text-white`): `className="w-full bg-primary hover:bg-indigo-700 text-white shadow-sm rounded-xl h-10 font-bold tracking-wide text-xs"`
- **Line 378** (`text-white`): `className="mt-6 bg-primary hover:bg-indigo-700 text-white rounded-xl shadow-sm"`

### `app/employee/profile/page.tsx`
- **Line 215** (`text-white`): `<div className="w-20 h-20 bg-primary rounded-xl flex items-center justify-center font-black text-2xl text-white shadow-inner">`
- **Line 317** (`text-white`): `<Button onClick={() => setIsPasswordModalOpen(true)} className="rounded-xl h-10 px-6 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] uppercase tracking-widest group">`
- **Line 379** (`bg-black`): `className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"`
- **Line 478** (`text-white`): `<Button type="submit" disabled={isUpdatingPassword} className="flex-1 h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest">`

### `app/employee/projects/page.tsx`
- **Line 185** (`text-white`): `className="w-full h-9 px-4 text-sm font-bold bg-primary hover:bg-indigo-700 text-white rounded-lg transition-all shadow-sm hover:shadow-indigo-200 hover:shadow-md flex items-center gap-2"`

### `app/employee/projects/view-doc/page.tsx`
- **Line 78** (`text-white`): `<div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-6">`
- **Line 91** (`text-white`): `<div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-6">`
- **Line 100** (`text-white`): `<div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-6">`
- **Line 236** (`text-white`): `className="text-muted-foreground hover:text-white hover:bg-slate-800 rounded-xl px-3 h-10 flex items-center gap-2 border border-slate-800"`
- **Line 242** (`text-white`): `<h2 className="text-sm font-black tracking-tight text-white max-w-[280px] md:max-w-[400px] truncate" title={docName}>`
- **Line 264** (`text-white`): `className="h-8 w-8 text-muted-foreground hover:text-white hover:bg-slate-800 rounded-lg"`
- **Line 273** (`text-white`): `className="h-8 w-8 text-muted-foreground hover:text-white hover:bg-slate-800 rounded-lg"`
- **Line 281** (`text-white`): `className="h-8 w-8 text-muted-foreground hover:text-white hover:bg-slate-800 rounded-lg border-l border-slate-800 pl-1.5 ml-1"`
- **Line 293** (`text-white`): `className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-10 px-5 font-black text-[10px] uppercase tracking-widest transition-all shadow-md flex items-center gap-2"`
- **Line 301** (`text-white`): `className="bg-primary hover:bg-indigo-700 text-white rounded-xl h-10 px-5 font-black text-[10px] uppercase tracking-widest transition-all shadow-md hover:shadow-indigo-500/10 flex items-center gap-2"`
- **Line 309** (`text-white`): `className="border-slate-800 hover:border-slate-700 bg-slate-950 text-slate-300 hover:text-white hover:bg-slate-900 rounded-xl h-10 px-5 font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2"`
- **Line 329** (`text-black`): `<Card className="w-full bg-background text-black overflow-hidden shadow-2xl rounded-xl min-h-[82vh] p-8 no-print">`
- **Line 333** (`text-black`): `<Card className="w-full bg-background text-black overflow-hidden shadow-2xl rounded-xl min-h-[82vh] no-print relative">`
- **Line 356** (`text-black`): `<Card className="w-full bg-background text-black overflow-hidden shadow-2xl rounded-xl min-h-[82vh] p-8 no-print overflow-x-auto">`
- **Line 386** (`text-white`): `<h3 className="text-lg font-black text-white uppercase tracking-wider">{docName.split('.').pop()?.toUpperCase()} File</h3>`
- **Line 393** (`text-white`): `className="bg-primary hover:bg-indigo-700 text-white rounded-xl h-11 w-full font-black text-[10px] uppercase tracking-widest shadow-lg"`

### `app/employee/projects/[id]/page.tsx`
- **Line 236** (`text-white`): `project.status === 'active' ? "bg-primary text-white" :`
- **Line 237** (`text-white`): `project.status === 'completed' ? "bg-emerald-600 text-white" :`
- **Line 341** (`text-white`): `<Button className="h-9 px-4 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">`
- **Line 449** (`text-white`): `className="w-full h-12 bg-primary text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-xl shadow-indigo-100 hover:bg-indigo-700"`
- **Line 537** (`text-white`): `<Card className="rounded-xl border-none shadow-2xl shadow-slate-200/50 bg-slate-900 text-white overflow-hidden">`
- **Line 554** (`border-white`): `<div className="p-3 bg-white/5 rounded-xl border border-white/10 flex items-center space-x-3">`
- **Line 561** (`border-white`): `<div className="p-3 bg-white/5 rounded-xl border border-white/10 flex items-center space-x-3">`

### `app/employee/templates/page.tsx`
- **Line 181** (`text-white`): `className="flex-1 h-10 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm"`

### `app/employee/timesheets/page.tsx`
- **Line 192** (`text-white`): `{ key: 'all', label: 'All', count: counts.all, color: 'text-muted-foreground', activeColor: 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' },`
- **Line 193** (`text-white`): `{ key: 'approved', label: 'Approved', count: approvedCount, color: 'text-emerald-600', activeColor: 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' },`
- **Line 194** (`text-white`): `{ key: 'pending', label: 'Pending', count: pendingCount, color: 'text-amber-600', activeColor: 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' },`
- **Line 195** (`text-white`): `{ key: 'rejected', label: 'Rejected', count: rejectedCount, color: 'text-red-600', activeColor: 'bg-red-500 text-white shadow-lg shadow-red-500/20' },`
- **Line 212** (`text-white`): `case 'approved': return 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-sm shadow-emerald-500/25';`
- **Line 213** (`text-white`): `case 'rejected': return 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-sm shadow-red-500/25';`
- **Line 214** (`text-white`): `default: return 'bg-gradient-to-r from-amber-400 to-amber-500 text-white shadow-sm shadow-amber-400/25';`
- **Line 238** (`text-white`): `<h2 className="text-2xl md:text-3xl font-black tracking-tight text-white uppercase">`
- **Line 448** (`text-white`): `className="mt-2 bg-primary hover:bg-indigo-700 text-white rounded-xl h-10 px-6 text-[10px] font-black uppercase tracking-widest"`
- **Line 526** (`text-white`): `"h-5 w-5 rounded-full ring-2 ring-white flex items-center justify-center text-[7px] font-black text-white",`
- **Line 605** (`to-white`): `className="px-6 py-5 bg-gradient-to-b from-slate-50/80 to-white"`
- **Line 626** (`text-white`): `<div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white">`
- **Line 770** (`text-white`): `? "bg-primary text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 hover:text-white"`
- **Line 784** (`text-white`): `className="bg-slate-900 text-white hover:bg-slate-800 rounded-xl h-9 px-4 font-black text-[10px] uppercase tracking-widest transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-95 disabled:opacity-50"`

### `app/employee/timesheets/view-doc/page.tsx`
- **Line 74** (`text-white`): `<div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-6">`
- **Line 87** (`text-white`): `<div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-6">`
- **Line 96** (`text-white`): `<div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-6">`
- **Line 234** (`text-white`): `className="text-muted-foreground hover:text-white hover:bg-slate-800 rounded-xl px-3 h-10 flex items-center gap-2 border border-slate-800"`
- **Line 240** (`text-white`): `<h2 className="text-sm font-black tracking-tight text-white max-w-[280px] md:max-w-[400px] truncate" title={docName}>`
- **Line 264** (`text-white`): `className="h-8 w-8 text-muted-foreground hover:text-white hover:bg-slate-800 rounded-lg"`
- **Line 273** (`text-white`): `className="h-8 w-8 text-muted-foreground hover:text-white hover:bg-slate-800 rounded-lg"`
- **Line 281** (`text-white`): `className="h-8 w-8 text-muted-foreground hover:text-white hover:bg-slate-800 rounded-lg border-l border-slate-800 pl-1.5 ml-1"`
- **Line 293** (`text-white`): `className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-10 px-5 font-black text-[10px] uppercase tracking-widest transition-all shadow-md flex items-center gap-2"`
- **Line 301** (`text-white`): `className="bg-primary hover:bg-indigo-700 text-white rounded-xl h-10 px-5 font-black text-[10px] uppercase tracking-widest transition-all shadow-md hover:shadow-indigo-500/10 flex items-center gap-2"`
- **Line 309** (`text-white`): `className="border-slate-800 hover:border-slate-700 bg-slate-950 text-slate-300 hover:text-white hover:bg-slate-900 rounded-xl h-10 px-5 font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2"`
- **Line 330** (`text-black`): `<Card className="w-full bg-background text-black overflow-hidden shadow-2xl rounded-xl min-h-[82vh] p-8 no-print">`
- **Line 334** (`text-black`): `<Card className="w-full bg-background text-black overflow-hidden shadow-2xl rounded-xl min-h-[82vh] no-print relative">`
- **Line 359** (`text-white`): `<h3 className="text-lg font-black text-white uppercase tracking-wider">{docName.split('.').pop()?.toUpperCase()} File</h3>`
- **Line 366** (`text-white`): `className="bg-primary hover:bg-indigo-700 text-white rounded-xl h-11 w-full font-black text-[10px] uppercase tracking-widest shadow-lg"`

### `app/error.tsx`
- **Line 34** (`text-white`): `className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 px-6 rounded-xl shadow-xl shadow-blue-200"`

### `app/global-error.tsx`
- **Line 36** (`text-white`): `className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 px-6 rounded-xl shadow-xl shadow-blue-200"`

### `app/login/page.tsx`
- **Line 310** (`text-white`): `<ShieldCheck className="h-8 w-8 text-white" />`
- **Line 411** (`text-white`): `className="w-full h-12 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl transition-all duration-300 font-bold text-sm shadow-xl shadow-emerald-200"`
- **Line 449** (`text-white`): `className="w-full h-12 bg-blue-600 text-white hover:bg-blue-700 rounded-xl transition-all duration-300 font-bold text-sm shadow-xl shadow-blue-200"`
- **Line 494** (`text-white`): `className="w-full h-12 bg-blue-600 text-white hover:bg-blue-700 rounded-xl transition-all duration-300 font-bold text-sm shadow-xl shadow-blue-200"`
- **Line 610** (`text-white`): `className="w-full h-12 bg-blue-600 text-white hover:bg-blue-700 rounded-xl transition-all duration-300 font-bold text-sm shadow-xl shadow-blue-200 group"`

### `app/reset-password/page.tsx`
- **Line 172** (`text-white`): `className="w-full h-12 bg-blue-600 text-white hover:bg-blue-700 rounded-xl transition-all duration-300 font-bold text-sm shadow-xl shadow-blue-200"`
- **Line 219** (`text-white`): `<ShieldCheck className="h-8 w-8 text-white" />`

### `app/setup-account/page.tsx`
- **Line 123** (`text-white`): `<ShieldCheck className="h-8 w-8 text-white" />`
- **Line 233** (`text-white`): `className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-[11px] uppercase tracking-widest shadow-xl shadow-slate-900/20 transition-all group"`

### `app/superadmin/admins/page.tsx`
- **Line 201** (`text-white`): `className="bg-primary text-white hover:bg-indigo-700 rounded-lg h-10 px-5 text-sm font-semibold shadow-sm transition-all"`
- **Line 246** (`text-white`): `<AvatarFallback className="bg-slate-900 text-white text-[10px] font-black">`
- **Line 327** (`text-white`): `<div className="bg-slate-900 p-6 text-white relative overflow-hidden">`
- **Line 332** (`text-white`): `<DialogTitle className="text-2xl font-black uppercase tracking-tight text-white">`
- **Line 441** (`text-white`): `className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg h-10 px-6 font-black uppercase tracking-widest text-[10px] shadow-sm"`
- **Line 461** (`text-white`): `<div className="bg-slate-900 p-6 text-white relative overflow-hidden">`
- **Line 466** (`text-white`): `<DialogTitle className="text-2xl font-black uppercase tracking-tight text-white">`
- **Line 580** (`text-white`): `className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg h-10 px-6 font-black uppercase tracking-widest text-[10px] shadow-sm"`
- **Line 594** (`text-white`): `<div className="bg-emerald-500 p-6 text-white text-center relative overflow-hidden">`
- **Line 599** (`text-white`): `<DialogTitle className="text-2xl font-black uppercase tracking-tight text-white text-center">`
- **Line 612** (`text-white`): `className="w-full h-10 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-black uppercase text-[10px] tracking-widest shadow-sm hover:-translate-y-0.5 transition-transform"`
- **Line 623** (`text-white`): `<div className="bg-rose-500 p-6 text-white text-center relative overflow-hidden">`
- **Line 628** (`text-white`): `<DialogTitle className="text-2xl font-black uppercase tracking-tight text-white text-center">`

### `app/superadmin/attendance/[userId]/page.tsx`
- **Line 144** (`text-white`): `<div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl text-white font-black shrink-0 shadow-lg shadow-indigo-500/30">`

### `app/superadmin/dashboard/page.tsx`
- **Line 190** (`text-white`): `<Button className="bg-primary text-white hover:bg-indigo-700 rounded-lg h-10 px-5 text-sm font-semibold shadow-sm transition-all">`
- **Line 277** (`rgb(`): `contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }}`

### `app/superadmin/employees/page.tsx`
- **Line 237** (`text-white`): `className="bg-primary text-white hover:bg-indigo-700 rounded-lg h-10 px-5 text-sm font-semibold shadow-sm transition-all"`
- **Line 297** (`text-white`): `<AvatarFallback className="bg-gradient-to-br from-indigo-500 to-blue-600 text-white text-[10px] font-black">`
- **Line 427** (`text-white`): `<div className="bg-emerald-500 p-6 text-white text-center relative overflow-hidden">`
- **Line 432** (`text-white`): `<Mail className="h-8 w-8 text-white" />`
- **Line 435** (`text-white`): `<DialogTitle className="text-2xl font-black uppercase tracking-tight text-white text-center">`
- **Line 439** (`text-white`): `Resource <span className="font-black text-white">{newEmployeeName}</span> has been securely initialized in the network.`
- **Line 448** (`text-white`): `className="w-full h-10 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-black uppercase text-[10px] tracking-widest shadow-sm hover:-translate-y-0.5 transition-transform"`

### `app/superadmin/employees/[id]/page.tsx`
- **Line 182** (`text-white`): `<Button onClick={() => setIsStatusModalOpen(true)} className={cn("text-white rounded-xl shadow-lg px-6 font-bold text-[10px] uppercase tracking-widest", employee.is_active ? "bg-amber-500 hover:bg-amber-600 shadow-amber-200" : "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200")}>`
- **Line 186** (`text-white`): `<Button onClick={handleEdit} className="bg-blue-600 text-white hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-200 px-6 font-bold text-[10px] uppercase tracking-widest">`
- **Line 189** (`text-white`): `<Button onClick={() => setIsDeleteModalOpen(true)} className="bg-rose-600 text-white hover:bg-rose-700 rounded-xl shadow-lg shadow-rose-200 px-6 font-bold text-[10px] uppercase tracking-widest">`
- **Line 208** (`text-white`): `<AvatarFallback className="bg-gradient-to-br from-slate-900 to-slate-800 text-white text-2xl font-black rounded-full">`
- **Line 219** (`text-white`): `employee.is_active ? "bg-emerald-400 text-white shadow-emerald-400/30" : "bg-rose-500 text-white shadow-rose-500/30"`
- **Line 533** (`rgba(`): `<DialogContent className="sm:max-w-[750px] p-0 overflow-y-auto overflow-x-hidden max-h-[90vh] border border-border/50 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)] rounded-[2.5rem] bg-slate-50/50 backdrop-blur-xl flex flex-col [&>button]:hidden">`
- **Line 541** (`text-white`): `<DialogTitle className="text-3xl font-black uppercase tracking-tight flex items-center gap-4 text-white drop-shadow-sm">`
- **Line 542** (`border-white`): `<div className="h-14 w-14 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/20 shadow-inner">`
- **Line 543** (`text-white`): `<Activity className="h-7 w-7 text-white" />`
- **Line 546** (`text-white`): `<span className="block text-white">Log Details</span>`
- **Line 547** (`text-white`): `<span className="block text-[10px] font-bold text-white/60 tracking-widest mt-1">Timesheet Submission Record</span>`
- **Line 675** (`text-white`): `className="rounded-xl font-black uppercase text-[10px] h-12 px-10 bg-slate-900 text-white hover:bg-slate-800 shadow-xl shadow-slate-900/20 transition-all active:scale-95 shrink-0"`
- **Line 709** (`text-white`): `className={employee.is_active ? "bg-amber-600 hover:bg-amber-700 text-white" : "bg-emerald-600 hover:bg-emerald-700 text-white"}`

### `app/superadmin/notes/page.tsx`
- **Line 257** (`text-white`): `? "bg-primary text-white shadow-md shadow-indigo-200"`

### `app/superadmin/projects/page.tsx`
- **Line 203** (`text-white`): `className="bg-primary text-white hover:bg-indigo-700 rounded-lg h-10 px-5 shadow-sm transition-all text-sm font-semibold"`

### `app/superadmin/projects/ProjectFormModal.tsx`
- **Line 724** (`text-white`): `className="h-10 px-6 w-full sm:w-auto rounded-md bg-primary hover:bg-indigo-700 text-white text-sm font-medium shadow-sm transition-colors"`

### `app/superadmin/projects/view-doc/page.tsx`
- **Line 78** (`text-white`): `<div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-6">`
- **Line 91** (`text-white`): `<div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-6">`
- **Line 100** (`text-white`): `<div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-6">`
- **Line 236** (`text-white`): `className="text-muted-foreground hover:text-white hover:bg-slate-800 rounded-xl px-3 h-10 flex items-center gap-2 border border-slate-800"`
- **Line 242** (`text-white`): `<h2 className="text-sm font-black tracking-tight text-white max-w-[280px] md:max-w-[400px] truncate" title={docName}>`
- **Line 264** (`text-white`): `className="h-8 w-8 text-muted-foreground hover:text-white hover:bg-slate-800 rounded-lg"`
- **Line 273** (`text-white`): `className="h-8 w-8 text-muted-foreground hover:text-white hover:bg-slate-800 rounded-lg"`
- **Line 281** (`text-white`): `className="h-8 w-8 text-muted-foreground hover:text-white hover:bg-slate-800 rounded-lg border-l border-slate-800 pl-1.5 ml-1"`
- **Line 293** (`text-white`): `className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-10 px-5 font-black text-[10px] uppercase tracking-widest transition-all shadow-md flex items-center gap-2"`
- **Line 301** (`text-white`): `className="bg-primary hover:bg-indigo-700 text-white rounded-xl h-10 px-5 font-black text-[10px] uppercase tracking-widest transition-all shadow-md hover:shadow-indigo-500/10 flex items-center gap-2"`
- **Line 309** (`text-white`): `className="border-slate-800 hover:border-slate-700 bg-slate-950 text-slate-300 hover:text-white hover:bg-slate-900 rounded-xl h-10 px-5 font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2"`
- **Line 329** (`text-black`): `<Card className="w-full bg-background text-black overflow-hidden shadow-2xl rounded-xl min-h-[82vh] p-8 no-print">`
- **Line 333** (`text-black`): `<Card className="w-full bg-background text-black overflow-hidden shadow-2xl rounded-xl min-h-[82vh] no-print relative">`
- **Line 356** (`text-black`): `<Card className="w-full bg-background text-black overflow-hidden shadow-2xl rounded-xl min-h-[82vh] p-8 no-print overflow-x-auto">`
- **Line 386** (`text-white`): `<h3 className="text-lg font-black text-white uppercase tracking-wider">{docName.split('.').pop()?.toUpperCase()} File</h3>`
- **Line 393** (`text-white`): `className="bg-primary hover:bg-indigo-700 text-white rounded-xl h-11 w-full font-black text-[10px] uppercase tracking-widest shadow-lg"`

### `app/superadmin/reporting-managers/page.tsx`
- **Line 212** (`text-white`): `className="bg-primary text-white hover:bg-indigo-700 rounded-lg h-10 px-5 text-sm font-semibold shadow-sm transition-all"`
- **Line 247** (`text-white`): `<AvatarFallback className="bg-slate-900 text-white text-[10px] font-black uppercase">`
- **Line 252** (`border-white`): `"absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-white shadow-sm",`
- **Line 338** (`rgba(`): `<DialogContent className="sm:max-w-[600px] max-h-[90vh] p-0 overflow-hidden flex flex-col border-none shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] rounded-[2.5rem] bg-background">`
- **Line 339** (`text-white`): `<div className="bg-gradient-to-br from-slate-900 to-indigo-950 p-6 sm:p-10 text-white relative shrink-0 overflow-hidden">`
- **Line 344** (`border-white`): `<div className="h-16 w-16 bg-white/10 rounded-[1.5rem] backdrop-blur-md flex items-center justify-center border border-white/20 shadow-2xl">`
- **Line 348** (`text-white`): `<DialogTitle className="text-xl sm:text-3xl font-black uppercase tracking-tighter text-white">`
- **Line 468** (`text-white`): `className="h-14 px-10 rounded-xl bg-primary hover:bg-indigo-700 text-white font-black uppercase text-[10px] tracking-widest shadow-2xl shadow-indigo-200 disabled:opacity-50 transition-all hover:-translate-y-1 active:scale-95"`

### `app/superadmin/reporting-managers/[id]/page.tsx`
- **Line 325** (`rgba(`): `<DialogContent className="sm:max-w-[600px] max-h-[90vh] p-0 overflow-hidden flex flex-col border-none shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] rounded-[2.5rem] bg-background">`
- **Line 326** (`text-white`): `<div className="bg-gradient-to-br from-slate-900 to-indigo-950 p-6 sm:p-10 text-white relative shrink-0 overflow-hidden">`
- **Line 329** (`border-white`): `<div className="h-16 w-16 bg-white/10 rounded-[1.5rem] backdrop-blur-md flex items-center justify-center border border-white/20 shadow-2xl">`
- **Line 333** (`text-white`): `<DialogTitle className="text-xl sm:text-3xl font-black uppercase tracking-tighter text-white">`
- **Line 450** (`text-white`): `className="h-14 px-10 rounded-xl bg-primary hover:bg-indigo-700 text-white font-black uppercase text-[10px] tracking-widest shadow-2xl shadow-indigo-200 disabled:opacity-50 transition-all hover:-translate-y-1 active:scale-95"`

### `app/superadmin/settings/page.tsx`
- **Line 236** (`text-white`): `className="bg-primary text-white hover:bg-indigo-700 h-9 rounded-md px-4 font-semibold text-sm transition-all"`
- **Line 427** (`text-white`): `className="bg-slate-900 text-white hover:bg-slate-800 h-9 rounded-md px-6 font-semibold text-sm transition-all"`

### `app/superadmin/templates/page.tsx`
- **Line 230** (`text-white`): `<Button className="h-9 px-4 rounded-md bg-primary hover:bg-indigo-700 text-white font-semibold shadow-sm transition-all text-sm">`
- **Line 322** (`text-white`): `className="w-full h-10 bg-primary text-white rounded-md font-semibold text-sm shadow-sm hover:bg-indigo-700 transition-all"`
- **Line 488** (`text-white`): `className="w-full h-10 bg-primary text-white rounded-md font-semibold text-sm shadow-sm hover:bg-indigo-700 transition-all"`

### `app/superadmin/timesheets/page.tsx`
- **Line 358** (`bg-black`): `className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"`
- **Line 498** (`text-white`): `className="h-9 px-4 rounded-md bg-red-600 hover:bg-red-700 text-white font-medium text-sm transition-all shadow-sm"`
- **Line 505** (`text-white`): `className="h-9 px-4 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm transition-all shadow-sm"`

### `app/superadmin/timesheets/view-doc/page.tsx`
- **Line 78** (`text-white`): `<div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-6">`
- **Line 91** (`text-white`): `<div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-6">`
- **Line 100** (`text-white`): `<div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-6">`
- **Line 241** (`text-white`): `className="text-muted-foreground hover:text-white hover:bg-slate-800 rounded-xl px-3 h-10 flex items-center gap-2 border border-slate-800"`
- **Line 247** (`text-white`): `<h2 className="text-sm font-black tracking-tight text-white max-w-[280px] md:max-w-[400px] truncate" title={docName}>`
- **Line 271** (`text-white`): `className="h-8 w-8 text-muted-foreground hover:text-white hover:bg-slate-800 rounded-lg"`
- **Line 280** (`text-white`): `className="h-8 w-8 text-muted-foreground hover:text-white hover:bg-slate-800 rounded-lg"`
- **Line 288** (`text-white`): `className="h-8 w-8 text-muted-foreground hover:text-white hover:bg-slate-800 rounded-lg border-l border-slate-800 pl-1.5 ml-1"`
- **Line 300** (`text-white`): `className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-10 px-5 font-black text-[10px] uppercase tracking-widest transition-all shadow-md flex items-center gap-2"`
- **Line 308** (`text-white`): `className="bg-primary hover:bg-indigo-700 text-white rounded-xl h-10 px-5 font-black text-[10px] uppercase tracking-widest transition-all shadow-md hover:shadow-indigo-500/10 flex items-center gap-2"`
- **Line 316** (`text-white`): `className="border-slate-800 hover:border-slate-700 bg-slate-950 text-slate-300 hover:text-white hover:bg-slate-900 rounded-xl h-10 px-5 font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2"`
- **Line 337** (`text-black`): `<Card className="w-full bg-background text-black overflow-hidden shadow-2xl rounded-xl min-h-[82vh] p-8 no-print">`
- **Line 341** (`text-black`): `<Card className="w-full bg-background text-black overflow-hidden shadow-2xl rounded-xl min-h-[82vh] no-print relative">`
- **Line 372** (`text-black`): `<Card className="w-full bg-background text-black overflow-hidden shadow-2xl rounded-xl min-h-[82vh] p-8 no-print overflow-x-auto">`
- **Line 402** (`text-white`): `<h3 className="text-lg font-black text-white uppercase tracking-wider">{docName.split('.').pop()?.toUpperCase()} File</h3>`
- **Line 409** (`text-white`): `className="bg-primary hover:bg-indigo-700 text-white rounded-xl h-11 w-full font-black text-[10px] uppercase tracking-widest shadow-lg"`

