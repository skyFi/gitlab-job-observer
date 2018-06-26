const {app, BrowserWindow, Menu, MenuItem, shell, Tray} = require('electron')
const path = require('path')
const url = require('url')
const menu = require('./lib/menu')
const notification = require('./lib/notification');
const jobs = require('./lib/jobs')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win, trayData = [], subTitleData = [], _tray = null;

// 创建窗口
function createWindow () {
  // Create the browser window.
  win = new BrowserWindow({
    width: 600,
    height: 600,
    x: 1500,
    y: 150,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    minimizable: false,
    skipTaskbar: true,
    hasShadow: false,
    title: 'GitlabJobObserver',
    icon: path.join(__dirname, './img/icon.png'),
  });
  win.once('ready-to-show', () => {
    win.show();
  });

  // and load the index.html of the app.
  win.loadURL(url.format({
    pathname: path.join(__dirname, 'public/index.html'),
    protocol: 'file:',
    slashes: true
  }));

  // Open the DevTools.
  // win.webContents.openDevTools();

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null
  })
}

app.dock.setIcon(path.join(__dirname, './img/icon.png'))

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  // 窗口
  createWindow();

  // 系统托盘
  if (!_tray) {
    _tray = new Tray(path.join(__dirname, './img/icon.png'));
    _tray.on('click', () => {
      if (win === null) {
        createWindow()
      } else {
        win.close();
      }
    });
  }

  // 菜单
  menu()

  // 轮循监听
  let lastDataCount = {};
  setInterval(function() {
    jobs(function(datas) {
      trayData = [];
      subTitleData = [];
      let currentDataCount = 0;
      datas.forEach(({ group: data, id }) => {
        if (!data) {
          return;
        }
        // const menu = new Menu();
        Object.keys(data).forEach(k => {
          currentDataCount = currentDataCount || 0;
          currentDataCount += data[k].length;

          trayData.push(k);
          trayData.push(data[k].length);
          data[k].forEach(l => {
            if (k === 'running') {
              subTitleData.push(`${l.name}`);
            }
            // menu.append(new MenuItem(
            //     {label: `${l.status}: ${l.name} => ${l.ref}`,
            //     click() { shell.openExternal(`http://code.smartstudy.com/smart-liuxue/smart-frontend/-/jobs/${l.id}`) }},
            //   )
            // )
          })
        })

        _tray.setTitle(trayData.join(' '));
        // _tray.setContextMenu(menu);  // crash issue: https://github.com/electron/electron/issues/12803

        if (currentDataCount != lastDataCount[id]) {
          if (trayData.length === 0 && win) {
            win.close();
          }

          if (trayData.length !== 0 && win === null) {
            createWindow();
          }
        }

        lastDataCount[id] = currentDataCount
      });
    });
  }, 2000);
});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
