export type GeminiPart={text?:string;thought?:boolean;thoughtSignature?:string;functionCall?:{name:string;args:Record<string,unknown>;id?:string};functionResponse?:{name:string;response:Record<string,unknown>;id?:string}};
export type GeminiContent={role:'user'|'model';parts:GeminiPart[]};
export type FunctionTool={name:string;description:string;parametersJsonSchema:Record<string,unknown>};
export class GeminiError extends Error{constructor(public status:number,public code:string){super(code)}}
export async function geminiRequest<T>(endpoint:string,body:unknown):Promise<T>{
 const key=process.env.GEMINI_API_KEY;if(!key)throw new GeminiError(401,'KEY_MISSING');
 const response=await fetch(`https://generativelanguage.googleapis.com/v1beta/${endpoint}`,{method:'POST',headers:{'x-goog-api-key':key,'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(45000)});
 const data=await response.json();
 if(!response.ok)throw new GeminiError(response.status,data.error?.status||'PROVIDER_ERROR');
 return data as T;
}
export async function generate(instructions:string,contents:GeminiContent[],tools:FunctionTool[]){
 const model=process.env.GEMINI_MODEL||'gemini-3.5-flash-lite';
 if(!/^gemini-[a-z0-9.-]+$/.test(model))throw new Error('INVALID_MODEL');
 const result=await geminiRequest<{candidates?:{content?:GeminiContent;finishReason?:string}[]}>(`models/${model}:generateContent`,{
  systemInstruction:{parts:[{text:instructions}]},contents,tools:[{functionDeclarations:tools}],
  toolConfig:{functionCallingConfig:{mode:'ANY'}},generationConfig:{maxOutputTokens:3000,temperature:.1}
 });
 const content=result.candidates?.[0]?.content;
 if(!content?.parts?.length)throw new Error('NO_MODEL_ANSWER');
 return content;
}
export function safeError(e:unknown){
 if(e instanceof Error&&e.name==='EvidenceStoreError')return e.message;
 if(e instanceof GeminiError){
  if(e.code==='KEY_MISSING')return 'Add GEMINI_API_KEY to the server’s .env.local file, then restart the app.';
  if(e.status===400||e.status===401||e.status===403)return 'Gemini could not authorise this request. Check the API key and project access in Google AI Studio.';
  if(e.status===429)return 'The Gemini free-tier limit has been reached. Please wait a moment and try again.';
  if(e.status===404)return 'The configured Gemini model is unavailable for this project. Check GEMINI_MODEL in the server settings.';
 }
 return 'The AI service could not complete this request. Please try again. No decision was recorded.';
}
