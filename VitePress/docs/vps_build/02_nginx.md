## nginx: HTTP site first, then HTTPS

In this section, we install nginx, make sure a simple HTTP site works, and then upgrade it to HTTPS with TLS certs.  
Goal: at the end, visiting `http://www.curvature.blog` works, and later `https://www.curvature.blog` works.

---

## 2.1 Install nginx and verify default page

+ install nginx
+ ``` shell
  apt update
  apt install nginx
  ```

+ check nginx status
+ ``` shell
  systemctl status nginx
  ```

+ verify on browser
  + visit your server IP in a browser
  + you should see nginx default page

---

## 2.2 Basic website file layout

For a simple site, we use the default web root:

+ default web root is `/var/www/html`
+ default index page (Debian) is `index.nginx-debian.html`

+ edit the index page to confirm you are serving your own content
+ ``` shell
  vim /var/www/html/index.nginx-debian.html
  ```

---

## 2.3 Add a server block for your domain

We want nginx to respond correctly when browser uses your domain name (not just IP).

There are multiple valid ways. In our notes, we directly added a server block (later we can move it into `sites-available`).

+ edit nginx main config (one working approach)
+ ``` shell
  vim /etc/nginx/nginx.conf
  ```

+ add a simple server block
  + example:
    ```nginx
    server {
        listen 80;
        server_name www.curvature.blog;
        root /var/www/html;
        index index.nginx-debian.html;
    }
    ```

+ test nginx config
+ ``` shell
  nginx -t
  ```

+ reload nginx
+ ``` shell
  systemctl reload nginx
  ```

---

## 2.4 Verify domain works (common pitfall)

At this stage:

+ visiting `http://YOUR_SERVER_IP` should work
+ visiting `http://www.curvature.blog` should also work

If IP works but domain does not:

+ check DNS A record points to the correct VPS IP
+ check nginx `server_name` matches exactly (`www.curvature.blog`)
+ check port 80 is open (firewall / provider rules)
+ check nginx is actually loading the config you edited

---

## 2.5 Common problems we encountered (and fix)

+ problem: `nginx -t` fails / nginx cannot reload
  + common cause: syntax errors in config
  + one specific mistake we made: wrote `server()` instead of `server{}`
  + fix:
    + correct the block syntax (`server { ... }`)
    + re-run `nginx -t` until it is successful
    + then reload nginx

+ problem: IP works but domain shows `refused to connect`
  + common causes:
    + DNS not propagated / wrong record
    + firewall / provider blocks port 80
    + server_name mismatch
  + fix:
    + confirm DNS points to VPS IP
    + ensure port 80 is allowed
    + ensure the correct server block is active

---

## 2.6 Upgrade to HTTPS (high-level plan)

Once HTTP works, we add HTTPS:

+ obtain TLS certificate (we used `acme.sh` + webroot mode)
+ install cert/key to a stable location (e.g. `/etc/nginx/cert/`)
+ add an HTTPS server block listening on 443
+ redirect HTTP (80) to HTTPS (443)
+ reload nginx and verify with browser / curl

(Details of cert issuance are recorded in the `acme.sh` section.)

---

## 2.7 HTTPS server block skeleton (for later)

After you have cert files ready, nginx HTTPS block typically includes:

+ `listen 443 ssl http2;`
+ `ssl_certificate` and `ssl_certificate_key`
+ TLS 1.3 enabled
+ X25519 curve preferred
+ optional HSTS header

---

## 2.8 Quick checklist for this stage

After this section, you should have:

+ nginx installed and running
+ a working HTTP page under `/var/www/html`
+ `http://www.curvature.blog` works
+ nginx config passes `nginx -t`
+ ready to proceed to certificate + HTTPS setup
