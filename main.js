import { BrowserWindow, app, Menu } from 'electron';

function createWindow () {
  const win = new BrowserWindow({ width: 1920, height: 1080 })
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    {
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
      },
      label: 'Options',
      submenu: [
        {
          label: 'Full Screen',
          accelerator: 'Escape',
          click: () => win.setFullScreen(!win.isFullScreen())
        },
        {
          label: 'Dev Tools',
          accelerator: 'F12',
          click: () => win.webContents.toggleDevTools()
        },
        {
          label: 'Reload Page',
          accelerator: 'F5',
          click: () => win.webContents.reload()
        }
      ]
    }
  ]))
  win.loadFile('index.html')
}
app.whenReady().then(createWindow);