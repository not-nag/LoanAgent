import type {Metadata} from 'next';
import '@fontsource-variable/geist';
import './globals.css';
export const metadata:Metadata={title:'Lendwise · Lending, with clarity',description:'An evidence-led personal loan workspace. Synthetic presales demonstration.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>;}
