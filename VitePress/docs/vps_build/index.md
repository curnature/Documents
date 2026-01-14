## Overview

Let's establish a step-by-step guide towards a personal VPS server that runs with 
+ Debian 12 + BBR
+ nginx TLS 1.3 + HTTP/2 on port 8443
+ Xray VLESS + REALITY + VISION on port 443
+ Fallbacks
+ Routing
+ Clients on PC and Android 

Special Thanks to [this tutorial](https://xtls.github.io/document/)! This note basically follows it, together with the help of ChatGPT to fix some specific problems that does not show up in the tutorial.

---

## Provisioning and baseline hardening

This section records what I usually do on a fresh Debian 12 VPS before installing any services (nginx / xray / etc.).  
Goal: make sure the system is updated, we have a non-root admin user, and SSH is hardened (avoid easy probing).

---

## 1.1 Prepare before login

+ collect the following information from your VPS provider
  + public IP address of the VPS
  + default login method (often `root` + password, or provider console)
  + your domain name (A record points to this VPS IP), e.g. `www.curvature.blog`
    + `DNS` - `Type A` - `Host: www.curvature.blog` - `Auswer: your server IP` - `TTL: 600(default)`

+ (recommended) keep a provider console access available
  + if you accidentally block SSH, the provider console is the “last rescue”

---

## 1.2 First login and system update

+ login to the VPS for the first time (usually as `root`)
+ update and upgrade packages
+ ``` shell
  apt update
  apt upgrade -y
  ```
+ (optional) install some basic tools
+ ``` shell
  apt install -y vim curl wget git unzip
  ```
+ (optional) reboot if kernel / libc was upgraded
+ ``` shell
  reboot
  ```

---

## 1.3 Create a non-root admin user

This is described in `01_users.md`, but the idea is part of the baseline hardening:

+ create a non-root user (e.g. `vpsadmin`)
+ grant sudo privilege
+ disable `root` login later

---

## 1.4 SSH hardening checklist

Goal: do not allow direct root login, and do not keep SSH on default port 22.

+ edit ssh config
+ ``` shell
  vim /etc/ssh/sshd_config
  ```

+ set a custom port
  + pick a number from $1024 < P < 65535$
  + example:
    ```
    Port 3145
    ```

+ disable root login
  + set:
    ```
    PermitRootLogin no
    ```

+ (recommended) restrict password login after key login works
  + keep:
    ```
    PubkeyAuthentication yes
    ```
  + later (after confirming ssh key works), set:
    ```
    PasswordAuthentication no
    ```

+ restart ssh service
+ ``` shell
  systemctl restart ssh
  ```

+ (important) do **NOT** close the current ssh session yet
  + open a new terminal on your local machine and test the new port first
  + ``` shell
    ssh -p 3145 vpsadmin@YOUR_SERVER_IP
    ```
  + only close the old session after the new connection works

---

## 1.5 Firewall / provider rule check

This part depends on your VPS provider. The main idea:

+ make sure the following ports are allowed (at least)
  + ssh port (example `3145`)
  + `80` for HTTP (nginx later)
  + `443` for HTTPS (nginx/xray later)

+ if you use a firewall tool (optional), open ports before enabling it
+ ``` shell
  # example with ufw (only if you decide to use ufw)
  ufw allow 3145/tcp
  ufw allow 80/tcp
  ufw allow 443/tcp
  ufw enable
  ```

---

## 1.6 Common problems we encountered (and fix)

+ problem: `ssh` shows `Connection refused` after reboot / config change
  + common causes:
    + ssh port changed but firewall / provider rule not updated
    + ssh config syntax error, ssh service failed to restart
  + fix:
    + keep old ssh session open while testing new port
    + use provider console to recover if locked out
    + re-check `/etc/ssh/sshd_config` and restart ssh again

+ problem: ssh port “became 22 again” unexpectedly
  + this happened once after risky system/kernel changes
  + fix:
    + re-check ssh config after reboot
    + avoid mixing old backports / mismatched kernel sources on Debian 12

+ problem: `sysctl: command not found`
  + cause: `sysctl` is located in `/usr/sbin/`, not always in normal user PATH
  + fix:
    + run with `sudo` (or use full path)
    + install `procps` if missing

---

## 1.7 A quick final checklist for this stage

After finishing baseline hardening, make sure:

+ you can login with `vpsadmin` using the new ssh port
+ `root` cannot login via ssh
+ `sudo` works for `vpsadmin`
+ system packages are upgraded
+ you still have a rescue path (provider console)
