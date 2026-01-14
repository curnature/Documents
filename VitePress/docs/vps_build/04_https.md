## nginx modern TLS settings (TLS 1.3 / HTTP2 / X25519)

In this section, we switch nginx from HTTP to HTTPS using the certs from section 3.  
Goal: `https://www.curvature.blog` works, and we confirm TLS 1.3 + HTTP/2 + X25519 are enabled.

---

## 4.1 Prepare cert paths

Before editing nginx config, confirm you have these two files from `acme.sh --install-cert`:

+ private key
  + `/etc/nginx/cert/www.curvature.blog.key`
+ full chain certificate
  + `/etc/nginx/cert/www.curvature.blog.fullchain.cer`

(nginx will read these paths in the HTTPS server block.)

---

## 4.2 Add HTTPS server block

We add a new server block listening on `443` with `ssl` + `http2`.

Key fields:

+ `listen 443 ssl http2;`
+ `server_name www.curvature.blog;`
+ `ssl_certificate` and `ssl_certificate_key`
+ `ssl_protocols TLSv1.3;`
+ prefer curve `X25519`

---

## 4.3 Redirect HTTP to HTTPS (recommended)

We usually keep a port 80 server block for redirect:

+ HTTP (80) only does:
  + redirect to HTTPS (443)
  + or still serve `.well-known` for ACME if needed (webroot mode)

After redirect is enabled:

+ visiting `http://www.curvature.blog` should automatically jump to `https://www.curvature.blog`

---

## 4.4 Enable TLS 1.3

To force TLS 1.3 only:

+ set:
  ```
  ssl_protocols TLSv1.3;
  ```

If you want to allow older clients (not recommended), you can include TLS 1.2, but in our setup we preferred modern-only.

---

## 4.5 Enable HTTP/2

In nginx, HTTP/2 is enabled by `http2` on the listen line:

+ example:
  ```
  listen 443 ssl http2;
  ```

(Modern nginx supports HTTP/2 over TLS automatically once enabled.)

---

## 4.6 Prefer X25519

We set the ECDH curve preference:

+ example:
  ```
  ssl_ecdh_curve X25519:secp256r1;
  ```

This usually makes nginx prefer X25519 if the client supports it.

---

## 4.7 Add HSTS header (optional but we enabled it)

Once HTTPS is stable, enable HSTS:

+ example:
  ```
  add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
  ```

Note:

+ do not enable HSTS too early (harder to debug if HTTPS is broken)
+ `preload` is optional; only use it if you really want preload behavior

---

## 4.8 Common problem we encountered: `no cipher match`

We hit this error during `nginx -t`:

+ `SSL_CTX_set_cipher_list(...) failed (SSL: ... no cipher match)`

Cause:

+ we tried to put TLS 1.3 cipher suite names into `ssl_ciphers`
+ but `ssl_ciphers` controls TLS 1.2 and below, and TLS 1.3 ciphers are handled differently

Fix:

+ do not manually set TLS 1.3 cipher names in `ssl_ciphers`
+ keep nginx/OpenSSL defaults for TLS 1.3 (recommended)
+ if you need custom TLS 1.2 ciphers, only list TLS 1.2 ciphers there

After removing/fixing the cipher settings:

+ `nginx -t` succeeded
+ nginx started normally

---

## 4.9 Test nginx config and reload

Always test before reload:

+ ``` shell
  nginx -t
  ```

Then reload:

+ ``` shell
  systemctl reload nginx
  ```

---

## 4.10 Verify TLS 1.3 + HTTP/2 in practice

We used `curl -v` to confirm:

+ TLS version is TLS 1.3
+ ALPN negotiated `h2` (HTTP/2)
+ certificate matches `www.curvature.blog`

Example test idea:

+ from the server:
  + connect to `https://www.curvature.blog`
  + check output shows TLS 1.3 and `h2`

---

## 4.11 Quick checklist for this stage

After finishing this section, you should have:

+ `https://www.curvature.blog` works in browser
+ nginx config passes `nginx -t`
+ TLS 1.3 is enabled
+ HTTP/2 is enabled
+ X25519 is preferred
+ HSTS is set (optional)
+ you understand the cipher list pitfall and its fix
