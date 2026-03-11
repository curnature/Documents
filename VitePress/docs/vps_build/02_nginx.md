## nginx: HTTP site first, then HTTPS

In this section, we install nginx, make sure a simple HTTP site works, and then upgrade it to HTTPS with TLS certs.  

Goal: at the end, visiting `http://www.curvature.blog` works, and later `https://www.curvature.blog` works.

---

## 2.1 Install nginx and verify default page

+ login as `vpsadmin` and install nginx
  ``` shell
  sudo apt update
  sudo apt install nginx
  ```

+ check nginx status
  ``` shell
  sudo systemctl status nginx
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
  ``` shell
  sudo vim /var/www/html/index.nginx-debian.html
  ```

---

## 2.3 Add a server block for your domain

We want nginx to respond correctly when browser uses your domain name (not just IP).

There are multiple valid ways. In our notes, we directly added a server block (later we can move it into `sites-available`).

+ edit nginx main config (one working approach)
  ``` shell
  sudo vim /etc/nginx/nginx.conf
  ```

+ add a simple server block
  ```nginx
  http {
    ...
    server {
      listen 80;
      server_name www.curvature.blog;
      root /var/www/html;
      index index.nginx-debian.html;
    }
  ...
  }
  ```

+ test nginx config
  ``` shell
  sudo nginx -t
  ```

+ reload nginx
  ``` shell
  sudo systemctl reload nginx
  ```

---

## 2.4 Verify domain works (common pitfall)

At this stage:

+ visiting `http://YOUR_SERVER_IP` should work
+ visiting `http://www.curvature.blog` should also work

If IP works but domain does not:

+ check DNS A record points to the correct VPS IP
    ``` bash
    ping -c 3 www.curvature.blog
    # The output IP should exactly match your VPS IP. If not, DNS hasn't propagated or is set incorrectly.
    ```
+ check nginx `server_name` matches exactly (`www.curvature.blog`)
    ``` bash
    sudo nginx -T | grep server_name
    # Ensure there are no typos in the domain name in your config.
    ```
+ check port 80 is open (firewall / provider rules)
    ``` bash
    sudo ss -tuln | grep :80  # Checks if nginx is actively listening on port 80
    sudo ufw status | grep 80 # Checks if your firewall allows traffic on port 80
    ```
+ check nginx is actually loading the config you edited
    ``` bash
    sudo nginx -t
    # If you want to see the entire configuration tree Nginx is currently using:
    sudo nginx -T
    ```

---

## 2.5 Common problems we encountered (and fix)

+ problem: `nginx -t` fails / nginx cannot reload
  + common cause: syntax errors in config
  + one specific mistake we made: wrote `server()` instead of `server{}`
  + fix:
    + correct the block syntax (`server { ... }`)
    + re-run `nginx -t` until it is successful
    + then reload nginx

+ problem: IP works but domain shows `refused to connect` or `connection reset`
  + common causes:
    + DNS not propagated / wrong record
    + firewall / provider blocks port 80
    + **Browser caching / HSTS:** If your browser previously visited this domain via HTTPS, it will force a connection to port 443. Since Nginx is currently only on port 80, it refuses the connection.
  + fix:
    + confirm DNS points to VPS IP
    + test using `curl -v http://www.curvature.blog` on the server to bypass browser caching.
    + test the domain in a fresh "Incognito/Private" browsing window.

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
