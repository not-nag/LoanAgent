import type {Metadata} from 'next';
import '@fontsource-variable/geist';
import './globals.css';
import './editorial.css';
export const metadata:Metadata={title:'Lendwise · Lending, with clarity',description:'Mangalore Bank personal lending workspace: application review, policy guidance and evidence-backed assistance.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>;}
