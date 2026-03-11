## Certificates with acme.sh (webroot) + permissions

In this section, we obtain TLS certificates for `www.curvature.blog` using `acme.sh` and `webroot` mode.  

Goal: we can issue a cert successfully, and install the cert/key to a stable path for nginx (e.g. `/etc/nginx/cert/`).  

Key idea: `webroot` mode requires nginx web root to be writable (at least temporarily) so ACME challenge files can be created.

---

## 3.1 Install acme.sh under a normal user

We run `acme.sh` under our non-root user (e.g. `vpsadmin`).

+ install `acme.sh`
  ``` shell
  wget -O - https://get.acme.sh | sh
  ```

+ reload shell environment (so `acme.sh` command is available)
  ``` shell
  source ~/.bashrc
  ```

+ (optional) upgrade acme.sh and enable auto-upgrade
  ``` shell
  acme.sh --upgrade --auto-upgrade
  ```

---

## 3.2 Choose CA (ZeroSSL vs Let's Encrypt)

At some point, `acme.sh` may default to ZeroSSL and ask for account email / EAB credentials.  
We switched to Let's Encrypt for simplicity.

+ set default CA to Let's Encrypt
  ``` shell
  acme.sh --set-default-ca --server letsencrypt
  ```

---

## 3.3 Prepare Webroot Permissions (Crucial Step)

If `/var/www/html` is owned by `root`, `acme.sh` (running as `vpsadmin`) will fail to create the `.well-known` challenge directory, resulting in a `Permission denied` error.

+ change ownership of webroot to allow `vpsadmin` to write
+ ensure nginx (`www-data`) can still read it by setting permissions to `755`
  ``` shell
  sudo chown -R vpsadmin:vpsadmin /var/www/html
  sudo chmod -R 755 /var/www/html
  ```

---

## 3.4 Issue certificate using webroot mode

`webroot` mode works like this:
+ ACME server asks you to prove domain ownership
+ `acme.sh` writes a challenge file into `<webroot>/.well-known/acme-challenge/...`
+ ACME server fetches that file from your domain via HTTP (port 80).

This requires:
+ `www.curvature.blog` must already point to your VPS IP.
+ nginx must already serve HTTP on port 80.

Issue the cert:
``` shell
acme.sh --issue \
  -d www.curvature.blog \
  --webroot /var/www/html
```
After success, the cert and key are temporarily stored under the acme.sh home directory (e.g., `~/.acme.sh/www.curvature.blog_ecc/`).

---

## 3.5 Prepare Cert Directory

We want nginx to read certs from a stable system path: `/etc/nginx/cert/`
+ create the directory if missing
  ``` shell
  sudo mkdir -p /etc/nginx/cert
  ```
+ grant `vpsadmin` ownership of the directory so `acme.sh` can install files there (otherwise you will get `touch: cannot touch... Permission denied`).
  ``` shell
  sudo chown vpsadmin:vpsadmin /etc/nginx/cert
  ```

---

## 3.6 Install cert/key and setup Auto-Renew
Certificates renew automatically because `acme.sh` runs on a cron schedule. But nginx must be reloaded to pick up the updated cert files. We use `--reloadcmd` so that every renewal automatically reloads nginx.
+ install the cert and define the reload command:
  ``` shell
  acme.sh --install-cert -d www.curvature.blog \
  --key-file       /etc/nginx/cert/www.curvature.blog.key \
  --fullchain-file /etc/nginx/cert/www.curvature.blog.fullchain.cer \
  --reloadcmd      "sudo systemctl reload nginx"
  ```
⚠️ Edge Case (Re-running the command): If you ever need to re-run this install command after you have locked down the file permissions (Step 3.8), acme.sh will fail with cp: cannot open ... for reading: Permission denied. To fix this, you must temporarily give vpsadmin ownership of the files before installing again:
``` shell
sudo chown vpsadmin:vpsadmin /etc/nginx/cert/www.curvature.blog.key /etc/nginx/cert/www.curvature.blog.fullchain.cer
```

---

## 3.7 Allow passwordless nginx reload (Required for Cron)

Because `--reloadcmd` runs automatically in the background via cron under the `vpsadmin` user, it cannot prompt for a `sudo` password. We must explicitly allow `vpsadmin` to reload nginx without a password.
+ edit the sudoers file
  ``` shell
  sudo visudo
  ```
+ add this exact line to the bottom of the file:
  ```
  vpsadmin ALL=(root) NOPASSWD: /usr/bin/systemctl reload nginx
  ```

---

# 3.8 Restrict permissions again (Crucial for Security)

After issuing the cert and installing it to the nginx path, it is critical to restrict permissions so your private key isn't exposed.

Our final goal: Let `vpsadmin` own the directory (so `acme.sh` can overwrite files on renewal), but lock down the files so only `root` (and Nginx) can read the private key.
+ apply the final security permissions:
  ``` shell
  sudo chown -R vpsadmin:vpsadmin /etc/nginx/cert
  sudo chmod 700 /etc/nginx/cert
  sudo chmod 600 /etc/nginx/cert/www.curvature.blog.key
  sudo chmod 644 /etc/nginx/cert/www.curvature.blog.fullchain.cer
  ```

--- 

# 3.9 Quick checklist for this stage
After finishing this section, you should have:
+ `acme.sh` installed and configured for Let's Encrypt.
+ `webroot` permissions cleanly configured for ACME challenges.
+ A successfully issued certificate for `www.curvature.blog`
+ Cert/key installed securely under `/etc/nginx/cert/`
+ Passwordless `sudo` configured so `acme.sh` can automatically run `systemctl reload nginx` upon renewal
+ File and directory permissions strictly tightened.
