import React, { useState, useRef, useEffect, useCallback } from 'react';

export default function BarcodeScanner({ onDetected, onClose, dark }) {
  const [tab,       setTab]       = useState('camera');
  const [manual,    setManual]    = useState('');
  const [msg,       setMsg]       = useState('Starting camera...');
  const [running,   setRunning]   = useState(false);
  const [err,       setErr]       = useState(false);

  const videoRef  = useRef(null);
  const streamRef = useRef(null);
  const rafRef    = useRef(null);
  const alive     = useRef(true);
  const canvas    = useRef(document.createElement('canvas'));

  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; stop(); };
  }, []);

  useEffect(() => {
    if (tab === 'camera') { const t = setTimeout(()=>{ if(alive.current) start(); },250); return ()=>clearTimeout(t); }
    else stop();
  }, [tab]);

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(t=>t.stop());
    streamRef.current = null;
    if (alive.current) setRunning(false);
  }, []);

  const start = useCallback(async () => {
    if (!videoRef.current) { setErr(true); setMsg('Camera view not ready. Use manual entry.'); return; }
    setErr(false); setMsg('Starting camera...');
    stop();
    try {
      let stream;
      try { stream = await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:1280},height:{ideal:720}}}); }
      catch { stream = await navigator.mediaDevices.getUserMedia({video:true}); }
      if (!alive.current) { stream.getTracks().forEach(t=>t.stop()); return; }
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      if (!alive.current) return;
      setRunning(true); setMsg('');
      if ('BarcodeDetector' in window) {
        const det = new window.BarcodeDetector({formats:['ean_13','ean_8','code_128','code_39','upc_a','upc_e','qr_code']});
        const loop = async () => {
          if (!alive.current || !videoRef.current) return;
          try { const r = await det.detect(videoRef.current); if (r.length) { stop(); if(alive.current) onDetected(r[0].rawValue); return; } } catch {}
          rafRef.current = requestAnimationFrame(loop);
        };
        rafRef.current = requestAnimationFrame(loop);
      } else {
        // ZXing fallback
        if (!window.ZXing) {
          await new Promise((res,rej)=>{ const s=document.createElement('script'); s.src='https://cdnjs.cloudflare.com/ajax/libs/zxing-js/0.20.0/zxing.min.js'; s.onload=res; s.onerror=rej; document.head.appendChild(s); });
        }
        const reader = new window.ZXing.MultiFormatReader();
        const cv = canvas.current; const ctx = cv.getContext('2d');
        const loop = () => {
          if (!alive.current || !videoRef.current) return;
          const vw=videoRef.current.videoWidth, vh=videoRef.current.videoHeight;
          if (vw>0&&vh>0) {
            cv.width=vw; cv.height=vh; ctx.drawImage(videoRef.current,0,0,vw,vh);
            const d=ctx.getImageData(0,0,vw,vh);
            try {
              const lum=new window.ZXing.RGBLuminanceSource(d.data,vw,vh);
              const bmp=new window.ZXing.BinaryBitmap(new window.ZXing.HybridBinarizer(lum));
              const res=reader.decode(bmp);
              if (res) { stop(); if(alive.current) onDetected(res.getText()); return; }
            } catch {}
          }
          rafRef.current = requestAnimationFrame(loop);
        };
        rafRef.current = requestAnimationFrame(loop);
      }
    } catch(e) {
      if (!alive.current) return;
      setErr(true); stop();
      const m = String(e?.message||e).toLowerCase();
      if (m.includes('permission')||m.includes('denied')||m.includes('notallowed'))
        setMsg('Camera access denied.\n\nFix: Tap the lock icon in your browser address bar → Camera → Allow → Refresh.');
      else if (m.includes('notfound')||m.includes('devicenotfound'))
        setMsg('No camera found on this device.');
      else
        setMsg('Could not start camera. Please use Manual Entry.');
    }
  }, [stop, onDetected]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80">
      <div className={`${dark?'bg-gray-900 border-gray-800':'bg-white border-gray-200'} border rounded-t-3xl w-full max-w-md max-h-[92vh] flex flex-col slide-up`}>
        <div className="flex justify-center pt-3"><div className={`w-10 h-1 rounded-full ${dark?'bg-gray-700':'bg-gray-200'}`}/></div>
        <div className="flex items-center justify-between px-5 py-3 flex-shrink-0">
          <div>
            <div className={`font-bold text-base ${dark?'text-white':'text-gray-900'}`}>Scan Barcode</div>
            <div className="text-xs text-gray-400">Camera is default · Manual available</div>
          </div>
          <button onClick={()=>{stop();onClose();}} className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 font-bold text-sm">Close</button>
        </div>

        {/* Tabs */}
        <div className={`flex mx-5 mb-3 ${dark?'bg-gray-800':'bg-gray-100'} rounded-xl p-1 flex-shrink-0`}>
          {[['camera','Camera (Default)'],['manual','Manual Entry']].map(([k,l])=>(
            <button key={k} onClick={()=>setTab(k)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${tab===k?(dark?'bg-gray-700 text-indigo-400 shadow':'bg-white text-indigo-500 shadow-sm'):'text-gray-400'}`}>
              {l}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-6">
          {/* Camera */}
          <div style={{display:tab==='camera'?'block':'none'}}>
            {err?(
              <div>
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 text-sm text-amber-700 dark:text-amber-400 mb-4 whitespace-pre-line leading-relaxed">{msg}</div>
                <button onClick={()=>setTab('manual')} className="btn-primary w-full">Use Manual Entry</button>
              </div>
            ):(
              <div>
                {!running&&msg&&<div className="text-center py-8 text-gray-400 text-sm font-medium">{msg}</div>}
                <div className="relative rounded-2xl overflow-hidden bg-black w-full" style={{aspectRatio:'4/3',display:running||!msg?'block':'none'}}>
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover block"/>
                  {running&&(
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-3/4 h-1/4 relative">
                        {[[0,0,'tl'],[0,'auto','tr'],['auto',0,'bl'],['auto','auto','br']].map(([t,r,k])=>(
                          <div key={k} className="absolute w-6 h-6" style={{top:t,right:r,bottom:t==='auto'?0:undefined,left:r==='auto'?0:undefined,borderTop:t===0?'3px solid #6366f1':undefined,borderBottom:t==='auto'?'3px solid #6366f1':undefined,borderLeft:r==='auto'?'3px solid #6366f1':undefined,borderRight:r===0?'3px solid #6366f1':undefined}}/>
                        ))}
                        <div className="absolute left-0 right-0 h-0.5 bg-indigo-500/60 scan-line top-1/2"/>
                      </div>
                    </div>
                  )}
                </div>
                {running&&<p className="text-center text-xs text-gray-400 mt-3">Point camera at barcode · Scanning automatically</p>}
              </div>
            )}
          </div>

          {/* Manual */}
          {tab==='manual'&&(
            <div>
              <label className="lbl">Barcode Number</label>
              <input autoFocus inputMode="numeric" value={manual} onChange={e=>setManual(e.target.value)}
                placeholder="e.g. 5449000000996"
                className={`inp font-mono text-lg tracking-widest mb-4 ${dark?'bg-gray-800 border-gray-700 text-white':'bg-gray-50 border-gray-200 text-gray-900'}`}/>
              <button onClick={()=>{if(manual.trim()){stop();onDetected(manual.trim());}}} disabled={!manual.trim()}
                className={`btn w-full text-base ${manual.trim()?'btn-primary':'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'}`}>
                Look Up Product
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
