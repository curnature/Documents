## Xray install + service basics

In this section, we install Xray on Debian 12, securely configure its runtime user, and confirm the service layout (binary/config/logs/systemd).

Goal: Xray is installed, runs securely as a dedicated system user (not `root` or `nobody`), and we know exactly where its configuration and logs live.

---

## 5.1 Install Xray using the official install script

We use the install script from the official repository to fetch the latest release.

+ download the installer script:
  ``` shell
  wget https://github.com/XTLS/Xray-install/raw/main/install-release.sh
  ```

+ run the installer (requires `sudo`):
  ``` shell
  sudo bash install-release.sh
  ```

Note: During installation, you might see errors like `rm: cannot remove '/etc/systemd/system/xray.service.d/10-donot_touch_multi_conf.conf': No such file or directory`. This just means the script is trying to clean up old config files that don't exist on your fresh server. It is safe to ignore.

---

## 5.2 Confirm installation paths (Important Reference)

The installation script automatically places Xray into the following default locations. Keep this list handy:

+ Xray binary (Executable):
  - `/usr/local/bin/xray`

+ Xray config directory & file:
  - `/usr/local/etc/xray/`
  - `/usr/local/etc/xray/config.json`

+ Geo data files (for routing rules):
  - `/usr/local/share/xray/geoip.dat`
  - `/usr/local/share/xray/geosite.dat`

+ Log directory:
  - `/var/log/xray/`
  - `/var/log/xray/access.log`
  - `/var/log/xray/error.log`

+ Systemd service files:
  - `/etc/systemd/system/xray.service`

---

## 5.3 Create a dedicated xray system user

By default, the install script configures the systemd service to run as `User=nobody`. For better security and isolation, we will create a dedicated system user specifically for Xray.

+ create the user with no home directory (`-r`) and no login shell (`-s /usr/sbin/nologin`) :
  ``` shell
  sudo useradd -r -s /usr/sbin/nologin xray
  ```
+ verify the user was created successfully:
  ``` shell
  getent passwd xray
  ```

---

## 5.4 Give the `xray` user ownership of configs and logs

The new `xray` user needs permission to read its configuration file and write to its log directory.

+ change ownership of the config and log directories:
  ``` shell
  sudo chown -R xray:xray /usr/local/etc/xray
  sudo chown -R xray:xray /var/log/xray
  ```

---

## 5.5 Override systemd to run as `xray`

Instead of editing the main `/etc/systemd/system/xray.service` file directly (which could be overwritten during future Xray updates), we create a "drop-in" override file.

+ create the override directory:
  ``` shell
  sudo mkdir -p /etc/systemd/system/xray.service.d
  ```
+ create the override configuration file :
  ``` shell
  sudo bash -c 'cat > /etc/systemd/system/xray.service.d/20-run-as-xray.conf <<EOF
  [Service]
  User=xray
  Group=xray
  EOF'
  ```
+ reload the systemd daemon to apply the changes, then restart Xray :
  ``` shell
  sudo systemctl daemon-reload
  sudo systemctl restart xray
  ```

---

## 5.6 Verify service status and logs

Let's ensure Xray is running cleanly under our new user.

+ check systemd status:
  ``` shell
  sudo systemctl status xray
  ```
  (You should see `active (running)`).
+ double-check that the process is actually running under the `xray` user (not `nobody`) :
  ``` shell
  ps aux | grep '[x]ray run'
  ```
+ Checking Logs (Crucial for Debugging):
  If Xray says `active (running)` but clients cannot connect, the configuration file is likely wrong. Always check the logs:
  ``` shell
  sudo tail -f /var/log/xray/error.log
  sudo tail -f /var/log/xray/access.log
  ```
  (Press Ctrl + C to exit the log tail)..
+ Check listening ports:
  ``` shell
  sudo ss -tulpn | grep xray
  ```

---

## 5.7 Quick checklist for this stage

After finishing this section, you should have:

+ Xray installed at `/usr/local/bin/xray`
+ A dedicated `xray` system user created.
+ Xray configuration and log directories owned by `xray:xray`.
+ A systemd drop-in override forcing the service to run as `User=xray`.
+ The `xray` service showing as `active (running)`.
+ The knowledge of how to check Xray's `error.log` and `access.log`.