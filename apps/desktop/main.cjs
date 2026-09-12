const { app, BrowserWindow, Menu } = require('electron');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const localPages = new Set(['index.html'].map(name=>pathToFileURL(path.join(__dirname,'../../dist',name)).href));
app.setName('Three Card Kingdoms');
if (process.env.THREE_CARD_USER_DATA) app.setPath('userData', path.resolve(process.env.THREE_CARD_USER_DATA));
else app.setPath('userData',path.join(app.getPath('appData'),'ThreeCardKingdoms'));
app.whenReady().then(() => {
  const win = new BrowserWindow({ width:1440,height:900,minWidth:1000,minHeight:700,backgroundColor:'#111e20',title:'三国 · 三张定天下',webPreferences:{preload:path.join(__dirname,'preload.cjs'),nodeIntegration:false,contextIsolation:true,sandbox:true,webSecurity:true} });
  win.on('blur',()=>win.webContents.send('game:pause'));
  win.on('minimize',()=>win.webContents.send('game:pause'));
  win.webContents.setWindowOpenHandler(() => ({action:'deny'}));
  win.webContents.on('will-navigate', (e,url) => {if(!localPages.has(url))e.preventDefault();});
  win.webContents.session.setPermissionRequestHandler((_contents,_permission,callback)=>callback(false));
  Menu.setApplicationMenu(Menu.buildFromTemplate([{label:'三张定天下',submenu:[{role:'about'},{type:'separator'},{role:'quit'}]},{label:'窗口',submenu:[{role:'togglefullscreen'},{role:'minimize'}]}]));
  win.loadFile(path.join(__dirname,'../../dist/index.html'));
});
app.on('window-all-closed',()=>app.quit());
