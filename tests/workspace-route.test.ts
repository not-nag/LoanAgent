import {test} from 'node:test';
import assert from 'node:assert/strict';
import {HOME_ROUTE,PAGE_PATHS,parseWorkspaceRoute,workspaceHref} from '../src/lib/workspace-route';

test('every main navigation destination can be opened directly and round-trips',()=>{
  for(const [page,path] of Object.entries(PAGE_PATHS)){
    const route=parseWorkspaceRoute(path);
    assert.equal(route.page,page);
    assert.equal(route.selected,null);
    assert.equal(workspaceHref(route),path);
  }
});
test('application detail and creation have distinct, refreshable URLs',()=>{
  assert.deepEqual(parseWorkspaceRoute('/applications/PL-1002/'),{...HOME_ROUTE,page:'Applications',selected:'PL-1002'});
  assert.equal(workspaceHref(parseWorkspaceRoute('/applications/PL-1002')),'/applications/PL-1002');
  assert.equal(parseWorkspaceRoute('/applications/new').newCase,true);
  assert.equal(workspaceHref(parseWorkspaceRoute('/applications/new')),'/applications/new');
});
test('unknown paths are not silently presented as the assistant or a different application',()=>{
  for(const path of ['/unknown','/applications/invalid','/applications/PL-1002/documents','/applications/PL-1002/extra','/applications/%3Cscript%3E']){
    assert.equal(parseWorkspaceRoute(path).missingPath,path);
  }
});
