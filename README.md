
# kinda-wabot
<div align="center">

![Preview](https://pbs.twimg.com/media/F7mCv6raYAARVBm?format=jpg&name=large)

<p>
WhatsApp bot toram berbasis Node.js
</p>

</div>

## NOTE BEFORE USING!!
- Dilarang keras menjual script ini
- Dilarang reupload tanpa izin

## Pra-syarat
* NodeJS V20+
* FFMPEG
* Imagemagick

### Instalasi (Ubuntu/Debian)
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y wget curl git ffmpeg imagemagick
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs gcc g++ make
```
### Setup Bot
```bash
git clone https://github.com/zaxerion/kinda-wabot.git
cd kinda-wabot
npm install
```
### Setup Konfigurasi
1. Rename file konfigurasi dan env.
2. Edit file sesuai kebutuhan.

## Run
```bash
node .
```
Argumen: `node . [--options] [<session name>]`  
Contoh:  
- `node . --pairing` → Login via pairing  
- `node . --dev` → mode dev  

### Run dengan  PM2
```bash
sudo npm install -g pm2
pm2 start main.js --name "bot"
pm2 save
pm2 startup
```
Perintah PM2:  
- `pm2 logs bot --lines 100` → Lihat log  
- `pm2 restart bot` → Restart bot  
- `pm2 stop bot` → Hentikan proses  

## Cron Job 
Jalankan `crontab -e`, lalu tambah:
```cron
0 */12 * * * find ~/kinda-wabot/sessions ! -name 'creds.json' -type f -delete
0 3 * * * rm -rf ~/kinda-wabot/tmp/*
```

## Update Script
```bash
git fetch origin
git reset --hard origin/main
```

### Thanks To
[![WhiskeySockets](https://github.com/WhiskeySockets.png?size=100)](https://github.com/WhiskeySockets/Baileys)
[![BochilGaming](https://github.com/BochilGaming.png?size=100)](https://github.com/BochilGaming)
[![Clicknetcafe](https://github.com/clicknetcafe.png?size=100)](https://github.com/clicknetcafe)

#### Contributor
[![Zaxerion](https://github.com/zaxerion.png?size=100)](https://github.com/zaxerion)
