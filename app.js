var { app, BrowserWindow, Menu, dialog } = require('electron');
var { autoUpdater, AppUpdater } = require('electron-updater');

var isMac = process.platform === 'darwin'
var mainWindow, AdditionalWindow;

// process.env.APPIMAGE = require('path').join(__dirname, 'dist', `Armygrid-${app.getVersion()}.AppImage`)
// Object.defineProperty(app, 'isPackaged', {
//   get() {
//     return true;
//   }
// });

autoUpdater.setFeedURL({
  provider: "github",
  owner: "mansimas",
  repo: "armygrid-app-win",
});

autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    title: 'Armygrid',
    width: 1200,
    height: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    },
    icon: __dirname + '/assets/AG_logo.png', 
  });
  mainWindow.loadURL('https://armygrid.com');
  createMainMenu();
  fromApp();
}

function createAdditionalWindow() {
  AdditionalWindow = new BrowserWindow({
    title: 'Armygrid',
    width: 1200,
    height: 700,
    webPreferences: {
      nodeIntegration: true
    },
    icon: __dirname + '/assets/AG_logo.png',
  });
  AdditionalWindow.loadURL('https://armygrid.com');
  createMainMenu();
  fromApp();
}

function fromApp() {
  mainWindow.webContents.executeJavaScript("localStorage.setItem('armygrid_from_app', true)", true);
}

async function showMessage() {
  var notification_upt = await mainWindow.webContents.executeJavaScript("localStorage.getItem('notif_for_update')", true);
  var notification_down = await mainWindow.webContents.executeJavaScript("localStorage.getItem('notif_for_download')", true);
  if (notification_upt && notification_down) {
    mainWindow.webContents.executeJavaScript("var div = document.createElement('div'); div.style.cssText += 'background: rgba(0, 0, 0, 0.6); z-index: 1001; height: 100%; width: 100%; position: fixed'; document.body.insertBefore(div, document.body.firstChild);", true);
    dialog.showMessageBox( mainWindow,
     {
        type: 'info',
        buttons:['OK'],
        title: 'Update Available',
        message: `${notification_upt} \n${notification_down}`,
      })
    .then(function(result) {
      if (result.response === 0) {
        return app.quit()
      }
    });
  }
}

app.whenReady().then(async () => {
  createMainWindow();
  var info_update = await autoUpdater.checkForUpdates();
  if(info_update.cancellationToken) showMessage()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  })
});

autoUpdater.on('checking-for-update', () => {
  return;
})

autoUpdater.on("update-available", (info) => {
  var notification = `Update available. Current version ${app.getVersion()}`
  mainWindow.webContents.executeJavaScript(`localStorage.setItem("notif_for_update", "${notification}")`, true)
  autoUpdater.downloadUpdate();
});

autoUpdater.on("update-not-available", (info) => {
  return;
});

autoUpdater.on("update-downloaded", (info) => {
  console.log(info)
  var notification =`Update downloaded. New version ${info.version}`;
  mainWindow.webContents.executeJavaScript(`localStorage.setItem("notif_for_download", "${notification}")`, true)
});

autoUpdater.on("error", (info) => {
  mainWindow.webContents.executeJavaScript(`alert("${info}")`, true).then(function () {
    return app.quit()
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

function createMainMenu() {
  var template = [
    {
      label: 'Back',
      click: () => {
        BrowserWindow.getFocusedWindow().webContents.goBack();
      }
    },
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    }] : []),
    {
      label: 'Window',
      submenu: [
        {
          label: 'New window',
          click: () => {
            createAdditionalWindow();
          }
        },
        { role: 'close' },
        { type: 'separator' },
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac ? [
          { type: 'separator' },
          { role: 'front' },
          { type: 'separator' },
          { role: 'window' }
        ] : [])
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        ...(isMac ? [
          { role: 'pasteAndMatchStyle' },
          { role: 'delete' },
          { role: 'selectAll' },
          { type: 'separator' },
          {
            label: 'Speech',
            submenu: [
              { role: 'startSpeaking' },
              { role: 'stopSpeaking' }
            ]
          }
        ] : [
          { role: 'delete' },
          { type: 'separator' },
          { role: 'selectAll' }
        ])
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Quit',
      click: () => {
        app.quit()
      }
    }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}
