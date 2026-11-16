export const PAGE_PATHS = {
  'Lending assistant': '/',
  Applications: '/applications',
  'Bank policy': '/policy',
  'Our approach': '/approach',
  Architecture: '/architecture',
  'About & FAQ': '/about',
} as const;
export type Page = keyof typeof PAGE_PATHS;
export type WorkspaceRoute = {
  page: Page;
  selected: string | null;
  newCase: boolean;
  missingPath?: string;
};
export const HOME_ROUTE: WorkspaceRoute = {page:'Lending assistant',selected:null,newCase:false};

export function parseWorkspaceRoute(pathname: string): WorkspaceRoute {
  const path = pathname.replace(/\/+$/, '') || '/';
  const page = (Object.entries(PAGE_PATHS) as [Page,string][]).find(([,url])=>url===path)?.[0];
  if (page) return {...HOME_ROUTE,page};
  if (path==='/applications/new') return {...HOME_ROUTE,page:'Applications',newCase:true};
  const match = /^\/applications\/(PL-\d+)$/.exec(path);
  if (match) return {...HOME_ROUTE,page:'Applications',selected:match[1]};
  return {...HOME_ROUTE,missingPath:pathname};
}

export function workspaceHref(route: WorkspaceRoute): string {
  if (route.missingPath) return route.missingPath;
  if (route.page==='Applications') {
    if (route.newCase) return '/applications/new';
    if (route.selected) return `/applications/${encodeURIComponent(route.selected)}`;
  }
  return PAGE_PATHS[route.page];
}
