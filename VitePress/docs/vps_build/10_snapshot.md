## “Poor man’s snapshots” and documentation

In this section, we record how we keep a “restore point” without a VPS snapshot feature.

Goal: if we break something, we can quickly recover configs and rebuild the server without starting from zero.

---

## 10.1 Why we need a “snapshot”

We noticed:

+ Our VPS provider (VMISS) does not expose a public one-click “snapshot” feature in their panel.
+ Sometimes a risky change (kernel / network / firewall) can lock us out.
+ Even if the project is not huge, rebuilding from scratch is annoying.

So we decided to keep a “poor man’s snapshot”:
+ Archive the important config files and directories into a single tarball.
+ Copy the archive to our local machine as a safety net.

---

## 10.2 What we save (The critical pieces)

We focused on saving “the important state”:

+ SSH hardening
  - `etc/ssh/sshd_config` (SSH port/root-login rules)

+ nginx config + website files
  - `etc/nginx` (all nginx vhosts, TLS settings, and `/etc/nginx/cert` paths)
  - `var/www/html` (our website content)

+ TLS / cert management
  - `home/vpsadmin/.acme.sh` (acme account + issued certs + renewal config)

+ Xray config + service
  - `usr/local/etc/xray` (Xray `config.json`)
  
Important note:
+ do **NOT** publish private keys / sensitive configs in a public repo
+ keep snapshots locally or in a private storage location

---

## 10.3 Create snapshot archive (tarball)

We created a tar archive that bundles key paths.

+ go to filesystem root (so paths in archive are clean)
  ``` shell
  cd /
  ```

+ create a tarball with date tag
  ``` shell
  sudo tar czvf /home/vpsadmin/server-backup-$(date +%F)-reality-working.tar.gz \
  etc/nginx \
  etc/ssh/sshd_config \
  usr/local/etc/xray \
  var/www/html \
  home/vpsadmin/.acme.sh
  ```

---

## 10.4 Copy snapshot to local machine

After tarball is created on VPS, download it to your laptop:
``` shell
scp -P 3145 vpsadmin@www.curvature.blog:/home/vpsadmin/server-backup-*-reality-working.tar.gz .
```

Notes:
+ use your custom SSH port (example: 3145)
+ keep snapshots in a local folder with clear naming

---

## 10.5 Restore idea (when something breaks)

If we ever totally ruin the server and reinstall Debian 12:
+ Reinstall base packages (nginx, sudo, etc.).
+ Upload the tarball back to the VPS /home/vpsadmin.
+ Extract it from the root directory:
  ``` shell
  cd /
  sudo tar xzvf /home/vpsadmin/server-backup-YYYY-MM-DD-reality-working.tar.gz
  ```
+ Restart services to apply the configs :
  ``` shell
  sudo systemctl restart nginx
  sudo systemctl restart xray
  sudo systemctl restart ssh
  ```
+ We are almost exactly where we left off.

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

## 10.7 Quick checklist for this stage

After finishing this section, you should have:
+ A repeatable command to archive key system configs.
+ Snapshots securely copied to your local machine.
+ A safe habit: snapshot after major milestones .