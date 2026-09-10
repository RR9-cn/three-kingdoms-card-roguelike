const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('desktopLifecycle',{onPause:callback=>{if(typeof callback==='function')ipcRenderer.on('game:pause',()=>callback());}});
