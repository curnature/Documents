## Certificates with acme.sh (webroot) + permissions

In this section, we obtain TLS certificates for `www.curvature.blog` using `acme.sh` and `webroot` mode.  
Goal: we can issue a cert successfully, and install the cert/key to a stable path for nginx (e.g. `/etc/nginx/cert/`).  
Key idea: `webroot` mode requires nginx web root to be writable (at least temporarily) so ACME challenge files can be created.

---

## 3.1 Install acme.sh under a normal user

We run `acme.sh` under our non-root user (e.g. `vpsadmin`).

+ install `acme.sh`
+ ``` shell
  wget -O - https://get.acme.sh | sh
  ```

+ reload shell environment (so `acme.sh` command is available)
+ ``` shell
  . ~/.bashrc
  ```

+ (optional) upgrade acme.sh and enable auto-upgrade
+ ``` shell
  acme.sh --upgrade --auto-upgrade
  ```

---

## 3.2 Choose CA (ZeroSSL vs Let's Encrypt)

At some point, `acme.sh` may default to ZeroSSL and ask for account email / EAB credentials.  
We switched to Let's Encrypt for simplicity.

+ set default CA to Let's Encrypt
+ ``` shell
  acme.sh --set-default-ca --server letsencrypt
  ```

---

## 3.3 Issue certificate using webroot mode

Webroot mode works like this:

+ ACME server asks you to prove domain ownership
+ `acme.sh` writes a challenge file into:
  + `<webroot>/.well-known/acme-challenge/...`
+ ACME server fetches that file from your domain via HTTP (port 80)

So this requires:

+ `www.curvature.blog` must already point to your VPS IP
+ nginx must already serve HTTP on port 80
+ your webroot directory must be writable by the user running `acme.sh`

Issue the cert:

+ ``` shell
  acme.sh --issue \
    -d www.curvature.blog \
    --webroot /var/www/html
  ```

After success, the cert and key are stored under the acme.sh home directory, e.g.:

+ `~/.acme.sh/www.curvature.blog_ecc/`
  + `www.curvature.blog.key`
  + `fullchain.cer`
  + etc.

---

## 3.4 Common problem: cannot write `.well-known` (permission denied)

We encountered this:

+ error example:
  + cannot create directory `/var/www/html/.well-known`: Permission denied
  + Cannot write token to file: `/var/www/html/.well-known/acme-challenge/...`

Cause:

+ `/var/www/html` is owned by root (or not writable by `vpsadmin`)
+ but `acme.sh` is running as `vpsadmin`, so it cannot create the challenge files

Fix (one working approach):

+ temporarily change ownership of webroot to allow writing
+ ``` shell
  chown -R vpsadmin:vpsadmin /var/www/html
  chmod -R 755 /var/www/html
  ```

After issuing cert successfully:

+ (recommended) restrict permissions again (see section 3.7)

---

## 3.5 Install cert/key into nginx cert directory

We want nginx to read certs from a stable system path, e.g.:

+ `/etc/nginx/cert/`

Create the directory if missing:

+ ``` shell
  mkdir -p /etc/nginx/cert
  ```

Then install cert and key:

+ ``` shell
  acme.sh --install-cert -d www.curvature.blog \
    --key-file       /etc/nginx/cert/www.curvature.blog.key \
    --fullchain-file /etc/nginx/cert/www.curvature.blog.fullchain.cer
  ```

---

## 3.6 Common problem: cannot write to `/etc/nginx/cert` (permission denied)

We hit this error:

+ `touch: cannot touch '/etc/nginx/cert/...': Permission denied`

Cause:

+ `/etc/nginx/cert` is root-owned, but `acme.sh` is running as `vpsadmin`

Fix options:

+ option A (what we did): temporarily allow `vpsadmin` to write that directory
  + ``` shell
    chown vpsadmin:vpsadmin /etc/nginx/cert
    ```
  + then rerun `--install-cert`

+ option B: run install step using root (not recommended unless you understand how acme.sh stores state)
  + the safer approach is usually to keep acme.sh under one user and only allow file write via directory permission

---

## 3.7 Auto-renew: reload nginx after renewal

Certificates renew automatically (acme.sh runs on a schedule).  
But nginx must be reloaded to pick up the updated cert files.

We used `--reloadcmd` so that every renewal also reloads nginx:

+ ``` shell
  acme.sh --install-cert -d www.curvature.blog \
    --key-file       /etc/nginx/cert/www.curvature.blog.key \
    --fullchain-file /etc/nginx/cert/www.curvature.blog.fullchain.cer \
    --reloadcmd      "sudo systemctl reload nginx"
  ```

---

## 3.8 Restrict permissions again (recommended)

After issuing cert and installing to nginx cert path, it is better to restrict permissions:

+ webroot `/var/www/html` does not need to be owned by `vpsadmin` forever
+ `/etc/nginx/cert` contains private key and should not be world-readable

Typical goals:

+ `/var/www/html` readable by nginx (and you), not world-writable
+ `/etc/nginx/cert/*.key` readable only by root and nginx (or by root only)

(Exact ownership/permission choices depend on whether nginx reads certs as root and drops privileges later, which is common.)

---

## 3.9 Quick checklist for this stage

After finishing this section, you should have:

+ `acme.sh` installed and usable under `vpsadmin`
+ a successfully issued certificate for `www.curvature.blog`
+ cert/key installed under `/etc/nginx/cert/`
+ an install step with `--reloadcmd` so renewals auto-reload nginx
+ permissions tightened after the issuance process
