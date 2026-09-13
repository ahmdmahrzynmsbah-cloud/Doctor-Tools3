const fs = require('fs');

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

pkg.main = "electron/main.cjs";
pkg.scripts["electron:dev"] = "cross-env NODE_ENV=development concurrently \"vite --port=3000\" \"wait-on http://localhost:3000 && electron .\"";
pkg.scripts["electron:build"] = "vite build && electron-builder";

pkg.build = {
  "appId": "com.foxtech.doctortools",
  "productName": "Doctor Tools",
  "directories": {
    "output": "release"
  },
  "win": {
    "icon": "public/logo.png",
    "target": ["nsis"]
  },
  "nsis": {
    "oneClick": false,
    "allowToChangeInstallationDirectory": true
  },
  "files": [
    "dist/**/*",
    "electron/**/*"
  ]
};

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
