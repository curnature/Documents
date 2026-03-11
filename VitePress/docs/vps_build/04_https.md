## nginx modern TLS settings (TLS 1.3 / HTTP2 / X25519)

In this section, we switch nginx from HTTP to HTTPS using the certs from section 3.  

Goal: `https://www.curvature.blog` works, and we confirm TLS 1.3 + HTTP/2 + X25519 are enabled.

---

## 4.1 Prepare cert paths

Before editing the nginx config, confirm your certs are sitting securely in the directory we created.

+ verify the files exist and have the correct permissions:
  ``` shell
  sudo ls -l /etc/nginx/cert/
  ```
+ you should see:
  - `/etc/nginx/cert/www.curvature.blog.key` (owned by root or vpsadmin, locked down)
  - `/etc/nginx/cert/www.curvature.blog.fullchain.cer`

---

## 4.2 The Complete HTTPS Server Block

Instead of piecing together the settings one by one, we will replace your existing HTTP server block in `/etc/nginx/nginx.conf` (inside the `http { ... }` block) with two new blocks: one to redirect HTTP to HTTPS, and one to serve the modern HTTPS site.
+ edit nginx main config:
  ``` shell
  sudo vim /etc/nginx/nginx.conf
  ```
+ replace your port 80 server block with the following :
  ``` nginx
  server {
    listen 80;
    listen [::]:80;
    server_name www.curvature.blog;
    return 301 https://$host$request_uri;
  }

  server {
    listen 443 ssl http2;
    listen [::1]:443 ssl http2;
    server_name www.curvature.blog;
    root /var/www/html;
    index index.nginx-debian.html index.html;

    ssl_certificate /etc/nginx/cert/www.curvature.blog.fullchain.cer;
    ssl_certificate_key /etc/nginx/cert/www.curvature.blog.key;

    ssl_protocols TLSv1.3;
    ssl_prefer_server_ciphers off;
    ssl_ecdh_curve X25519:secp256r1;

    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;

    location / {
        try_files $uri $uri/ =404;
    }
  }
  ```
Note: This block explicitly forces TLS 1.3, enables HTTP/2 on the listen line, and prioritizes the X25519 elliptic curve.

---

# 4.3 Common problem we encountered: `no cipher match`

When initially setting this up, we hit a fatal error during the config test.
+ Error output:
  ``` shell
  SSL_CTX_set_cipher_list(...) failed (SSL error:0A0000B9:SSL routines::no cipher match)
  ```
+ Cause:
  We tried to manually specify modern TLS 1.3 cipher suite names (like `TLS_AES_256_GCM_SHA384`) inside the `ssl_ciphers` directive . The `ssl_ciphers` directive is only meant for `TLS 1.2` and below. Because we forced `TLSv1.3`, OpenSSL couldn't find a matching cipher it understood from that specific list .
+ Fix:
  We completely removed (or commented out) the `ssl_ciphers` line. Nginx and OpenSSL will automatically use the optimal default ciphers for `TLS 1.3`.

---

# 4.4 Test nginx config and reload

Always test before restarting the service.
+ test syntax:
  ``` shell
  sudo nginx -t
  ```
+ if it says `syntax is ok` and `test is successful`, safely reload:
  ``` shell
  sudo systemctl reload nginx
  ```

---

# 4.5 Verify TLS 1.3 + HTTP/2 in practice

We need to confirm the server is actually using the modern protocols we specified. We use `curl` in verbose mode as an "x-ray view" of the connection.
+ from your local machine (or the server), run:
  ``` shell
  curl -v https://www.curvature.blog
  ```
+ look for these specific lines in the output to confirm success :
  - `* SSL connection using TLSv1.3`
  - `* ALPN, server accepted to use h2` (This confirms HTTP/2 is active)

---

## 4.6 Quick checklist for this stage

After finishing this section, you should have:
+ A global redirect from HTTP to HTTPS.
+ `https://www.curvature.blog` loading securely in your browser with a lock icon.
+ Nginx actively serving traffic using TLS 1.3 and HTTP/2.
+ A clean `sudo nginx -t` output.
+ A secure foundational web server ready to act as a decoy for Xray.