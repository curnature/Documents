## “Poor man’s snapshots” and documentation

In this section, we record how we keep a “restore point” without a VPS snapshot feature, and how we document the setup.  
Goal: if we break something, we can quickly recover configs and rebuild the server without starting from zero.

---

## 10.1 Why we need a “snapshot”

We noticed:

+ VPS providers do not always offer a real “snapshot” feature (or it is not enabled / not easy to use)
+ sometimes a risky change (kernel / network / firewall) can lock us out
+ even if the project is not huge, rebuilding from scratch is annoying

So we decided to keep a “poor man’s snapshot”:

+ archive the important config files and directories
+ copy the archive to our local machine (or another safe place)

---

## 10.2 What we save (recommended list)

We focused on saving “the important state”:

+ SSH hardening
  + `/etc/ssh/sshd_config`
  + (optional) `/etc/ssh/` as a whole

+ nginx config + website files
  + `/etc/nginx/`
  + `/var/www/html/` (or whatever web root you use)

+ TLS / cert management
  + `/etc/nginx/cert/`
  + `~/.acme.sh/` (acme account + issued certs + renewal config)

+ Xray config + service
  + `/usr/local/etc/xray/config.json`
  + `/etc/systemd/system/xray.service` (and drop-ins if used)
  + `/var/log/xray/` (optional, useful for debugging history)

+ (optional) system info record (not a file copy, but good notes)
  + Debian version, kernel version
  + open ports
  + enabled services

Important note:

+ do **NOT** publish private keys / sensitive configs in a public repo
+ keep snapshots locally or in a private storage location

---

## 10.3 Create snapshot archive (tarball)

We created a tar archive that bundles key paths.

+ go to filesystem root (so paths in archive are clean)
+ ``` shell
  cd /
  ```

+ create a tarball with date tag
+ ``` shell
  sudo tar czvf /home/vpsadmin/server-snapshot-$(date +%F).tar.gz \
    etc/ssh \
    etc/nginx \
    var/www/html \
    home/vpsadmin/.acme.sh \
    usr/local/etc/xray \
    etc/systemd/system/xray.service \
    etc/systemd/system/xray.service.d \
    var/log/xray
  ```

(You can remove items you do not want; logs are optional.)

---

## 10.4 Copy snapshot to local machine

After tarball is created on VPS, download it to your laptop:

+ ``` shell
  scp -P 3145 vpsadmin@YOUR_SERVER_IP:/home/vpsadmin/server-snapshot-YYYY-MM-DD.tar.gz .
  ```

Notes:

+ use your custom SSH port (example: 3145)
+ keep snapshots in a local folder with clear naming

---

## 10.5 Restore idea (when something breaks)

The restore concept is:

+ rebuild VPS (or fix via provider console)
+ install required packages again
+ copy snapshot tarball back
+ extract key config files
+ restart services

We usually restore only what we need:

+ nginx config + webroot
+ cert directory
+ xray config + systemd overrides

This avoids copying “too much system state”.

---

## 10.6 Documenting the whole setup

We discussed multiple documentation styles:

+ LaTeX notes (good for PDF, print, long-form)
+ Markdown in a GitHub repo (good for copy/paste, browsing, version control)

We decided to use Markdown because:

+ easy to maintain and update
+ great for code blocks and configs
+ can be published as GitHub Pages (`github.io`) if desired
+ can still be converted to PDF later if needed

---

## 10.7 Saving chat history (for reference)

We also wanted to preserve the full chat history as a backup reference:

+ export ChatGPT data (full archive)
+ or print/save a single conversation to PDF from browser

But the “real long-term solution” is:

+ convert the working steps into your own Markdown notes (like this repo)
+ keep them version-controlled

---

## 10.8 Quick checklist for this stage

After finishing this section, you should have:

+ a repeatable way to archive key system configs
+ snapshots copied to your local machine
+ Markdown documentation structure started (users / nginx / cert / xray / fallbacks / routing)
+ a safe habit: snapshot before risky changes
