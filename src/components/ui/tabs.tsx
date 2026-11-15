'use client';
import * as React from 'react';
import * as Primitive from '@radix-ui/react-tabs';
import {cn} from '@/lib/utils';
export const Tabs=Primitive.Root;
export function TabsList({className,...props}:React.ComponentProps<typeof Primitive.List>){return <Primitive.List className={cn('inline-flex items-center gap-5 border-b border-border w-full overflow-x-auto',className)} {...props}/>;}
export function TabsTrigger({className,...props}:React.ComponentProps<typeof Primitive.Trigger>){return <Primitive.Trigger className={cn('cursor-pointer shrink-0 whitespace-nowrap px-1 py-3 text-sm text-muted-foreground border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:font-semibold focus-visible:outline-2 focus-visible:outline-ring',className)} {...props}/>;}
export function TabsContent({className,...props}:React.ComponentProps<typeof Primitive.Content>){return <Primitive.Content className={cn('pt-5 focus-visible:outline-none',className)} {...props}/>;}
