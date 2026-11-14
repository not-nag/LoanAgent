import * as React from 'react';
import {Slot} from '@radix-ui/react-slot';
import {cva,type VariantProps} from 'class-variance-authority';
import {cn} from '@/lib/utils';
const buttonVariants=cva('inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:pointer-events-none disabled:opacity-40 cursor-pointer',{variants:{variant:{default:'bg-primary text-primary-foreground hover:bg-primary/90',outline:'border border-input bg-white hover:bg-slate-50',ghost:'hover:bg-slate-100',destructive:'bg-red-600 text-white hover:bg-red-700'},size:{default:'h-10 px-4 py-2',sm:'h-8 px-3 text-xs',icon:'size-9'}},defaultVariants:{variant:'default',size:'default'}});
export function Button({className,variant,size,asChild=false,...props}:React.ButtonHTMLAttributes<HTMLButtonElement>&VariantProps<typeof buttonVariants>&{asChild?:boolean}){const Comp=asChild?Slot:'button';return <Comp className={cn(buttonVariants({variant,size,className}))} {...props}/>;}
