'use client';
import * as React from 'react';
import * as Primitive from '@radix-ui/react-tabs';
import {cn} from '@/lib/utils';
export const Tabs=Primitive.Root;
export function TabsList({className,...props}:React.ComponentProps<typeof Primitive.List>){return <Primitive.List className={cn('inline-flex items-center gap-5 border-b border-slate-200 w-full',className)} {...props}/>;}
export function TabsTrigger({className,...props}:React.ComponentProps<typeof Primitive.Trigger>){return <Primitive.Trigger className={cn('cursor-pointer px-1 py-3 text-sm text-slate-500 border-b-2 border-transparent data-[state=active]:border-blue-700 data-[state=active]:text-blue-800 data-[state=active]:font-semibold focus-visible:outline-2 focus-visible:outline-blue-600',className)} {...props}/>;}
export function TabsContent({className,...props}:React.ComponentProps<typeof Primitive.Content>){return <Primitive.Content className={cn('pt-5 focus-visible:outline-none',className)} {...props}/>;}
