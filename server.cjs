'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.json':'application/json','.webmanifest':'application/manifest+json','.png':'image/png','.ico':'image/x-icon'};
const port = Number(process.env.PORT) || 3000;
http.createServer((req,res)=>{
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname); }
  catch { res.writeHead(400);res.end('Bad request');return; }
  const file = path.resolve(root, '.' + (pathname==='/'?'/index.html':pathname));
  if (file !== root && !file.startsWith(root+path.sep)) {res.writeHead(403);res.end('Forbidden');return;}
  fs.stat(file,(err,stat)=>{
    if(err||!stat.isFile()){res.writeHead(404);res.end('Not found');return;}
    res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache'});
    fs.createReadStream(file).pipe(res);
  });
}).listen(port,'0.0.0.0',()=>console.log('PokerHub preview ready on http://localhost:'+port));
