## Xray install + service basics

In this section, we install Xray on Debian 12 and confirm the service layout (binary/config/logs/systemd).  
Goal: Xray runs as a systemd service, and we know where its config and logs live.

---

## 5.1 Install Xray using the official install script

We used the install script from the official repo to install the latest release.

+ download installer script
+ ``` shell
  wget https://github.com/XTLS/Xray-install/raw/main/install-release.sh
  ```

+ run installer (requires root)
+ ``` shell
  sudo bash install-release.sh
  ```

After install, systemd service is enabled and started automatically.

---

## 5.2 Confirm installation paths (important)

The script installs Xray into these default locations:

+ Xray binary
  + `/usr/local/bin/xray`

+ Xray config directory
  + `/usr/local/etc/xray/`

+ main config file
  + `/usr/local/etc/xray/config.json`

+ geo data files
  + `/usr/local/share/xray/geoip.dat`
  + `/usr/local/share/xray/geosite.dat`

+ log directory
  + `/var/log/xray/`
  + `/var/log/xray/access.log`
  + `/var/log/xray/error.log`

+ systemd service files
  + `/etc/systemd/system/xray.service`
  + `/etc/systemd/system/xray@.service`
  + possible drop-in configs under:
    + `/etc/systemd/system/xray.service.d/`

---

## 5.3 Check service status and port listening

+ check systemd status
+ ``` shell
  sudo systemctl status xray
  ```

+ restart / reload when needed
+ ``` shell
  sudo systemctl restart xray
  ```

+ check listening ports (useful during debugging)
+ ``` shell
  sudo ss -tulpn | grep xray
  ```

---

## 5.4 Logs (most useful for debugging)

Xray logs are usually the fastest way to find the problem.

+ watch error log
+ ``` shell
  sudo tail -f /var/log/xray/error.log
  ```

+ watch access log
+ ``` shell
  sudo tail -f /var/log/xray/access.log
  ```

+ exit `tail -f`
  + press `Ctrl + C`

---

## 5.5 Service user (root / nobody / custom user)

By default, the install script sets:

+ systemd service runs as `User=nobody`

We discussed pros/cons and later decided:

+ create a dedicated user `xray`
+ run the service as that user for better isolation and clarity

(We implement this in later section.)

---

## 5.6 Common problems during installation (notes)

+ warning messages about missing drop-in configs
  + example: trying to remove a non-existing file under `/etc/systemd/system/xray.service.d/`
  + this is usually safe to ignore if install completes

+ service shows `active (running)` but nothing works
  + usually means config is wrong (inbound port, reality keys, routing rules, etc.)
  + check `error.log` and confirm `ss` shows listening on expected port

---

## 5.7 Quick checklist for this stage

After finishing this section, you should have:

+ Xray installed at `/usr/local/bin/xray`
+ config at `/usr/local/etc/xray/config.json`
+ logs under `/var/log/xray/`
+ systemd service `xray` running
+ ability to check listening ports and read logs
