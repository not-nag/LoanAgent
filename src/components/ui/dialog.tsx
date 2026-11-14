'use client';
import * as React from 'react';
import * as Primitive from '@radix-ui/react-dialog';
import {X} from 'lucide-react';
export const Dialog=Primitive.Root;export const DialogTitle=Primitive.Title;export const DialogDescription=Primitive.Description;
export function DialogContent({children,...props}:React.ComponentProps<typeof Primitive.Content>){return <Primitive.Portal><Primitive.Overlay className="fixed inset-0 z-50 bg-slate-950/35 backdrop-blur-sm"/><Primitive.Content className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-32px)] max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-7 shadow-2xl max-h-[85vh] overflow-auto" {...props}>{children}<Primitive.Close className="absolute top-5 right-5 rounded-md p-1 hover:bg-slate-100" aria-label="Close dialog"><X size={18}/></Primitive.Close></Primitive.Content></Primitive.Portal>;}
