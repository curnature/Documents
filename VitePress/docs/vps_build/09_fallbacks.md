## Port-sharing 443 with nginx “anti-probing” using fallbacks

In this section, we share port `443` between a normal HTTPS website (nginx) and `VLESS + REALITY + VISION` (Xray).  
Goal: when a normal browser visits `https://www.curvature.blog`, it shows the real website; when a REALITY client connects, it works as a proxy.  
This helps “anti-probing”: scanners probing 443 just see a normal HTTPS site.

---

## 9.1 Final architecture (what we want)

We want the final traffic path to look like this:

+ normal browser traffic
  + client -> `443` -> Xray -> `fallbacks` -> nginx (localhost `8443`) -> website

+ REALITY proxy traffic
  + client -> `443` -> Xray (REALITY handshake) -> proxy outbound

So:

+ Xray owns public `443`
+ nginx no longer listens on public `443`
+ nginx listens only on localhost `127.0.0.1:8443` (and `[::1]:8443`)
+ Xray forwards normal HTTPS to nginx using fallbacks

---

## 9.2 Move nginx HTTPS to localhost:8443

We modified nginx HTTPS server block:

+ instead of `listen 443 ...`
+ change to localhost only, example:
  + `listen 127.0.0.1:8443 ssl http2;`
  + `listen [::1]:8443 ssl http2;`

Important notes:

+ nginx should still use the same certificate files
+ nginx stays HTTPS-enabled (TLS still terminates at nginx on localhost)

After changes:

+ test nginx config
+ ``` shell
  nginx -t
  ```
+ reload nginx
+ ``` shell
  systemctl reload nginx
  ```

---

## 9.3 How to test nginx on localhost correctly

After nginx moves to localhost, this is expected:

+ `curl https://www.curvature.blog:8443` from outside should fail (connection refused)
+ because nginx only listens on 127.0.0.1 / ::1

Correct test on the server:

+ ``` shell
  curl -vk https://127.0.0.1:8443 -H "Host: www.curvature.blog"
  ```

If this returns your HTML, nginx backend is healthy.

---

## 9.4 Common problem: TLS “broken pipe” after moving to 8443

We encountered:

+ `curl` to `127.0.0.1:8443` fails during TLS handshake (broken pipe)

Cause:

+ the `listen 127.0.0.1:8443` line was missing `ssl`
+ nginx then treats it as plain HTTP on 8443

Fix:

+ ensure listen line includes `ssl http2`
  + example:
    ```
    listen 127.0.0.1:8443 ssl http2;
    listen [::1]:8443 ssl http2;
    ```

Then reload nginx and test again.

---

## 9.5 Move Xray inbound to port 443

Now that nginx is no longer using public 443, Xray can bind 443:

+ update Xray inbound port to `443`
+ restart Xray
+ confirm it is listening:
+ ``` shell
  sudo ss -tuln | grep 443
  ```

Expected:

+ `*:443` is listening (Xray)
+ `127.0.0.1:8443` is listening (nginx)

---

## 9.6 Add fallbacks in Xray inbound

We add `fallbacks` in the same inbound, so normal HTTPS can be forwarded to nginx.

Key idea:

+ fallback dest should point to nginx backend
+ since nginx listens on localhost only, dest must be `127.0.0.1:8443`

We used:

+ specific fallbacks for `h2` and `http/1.1`
+ a final catch-all fallback to nginx

---

## 9.7 Major problem we hit: “connection reset” on browser

Symptom:

+ browser visiting `https://www.curvature.blog` shows:
  + `This site can’t be reached`
  + `The connection was reset`
+ `curl -vk https://www.curvature.blog` shows:
  + `Recv failure: Connection reset by peer`

Server log showed:

+ Xray repeatedly tries to dial:
  + `PUBLIC_IP:8443`
  + and gets `connection refused`

Cause (important):

+ if Xray fallback dest is written as just `8443` (without host)
  + Xray interprets it as public address: `PUBLIC_IP:8443`
  + but nginx is only on `127.0.0.1:8443`
+ if dest is written as `www.curvature.blog:8443`
  + it resolves to your public IP, still wrong

Fix:

+ set all fallback dest explicitly to localhost:
  + `127.0.0.1:8443`

After fix:

+ normal HTTPS works again
+ REALITY proxy still works
+ server is no longer “laggy” from repeated dial failures

---

## 9.8 Another critical pitfall: `realitySettings.dest` loop / wrong target

We also discussed the `realitySettings.dest` field.

Bad values:

+ `www.curvature.blog:443`
  + this can create a loop (because Xray is on 443)
+ `www.curvature.blog:8443`
  + resolves to public IP, nginx is not there

Correct value (in our final working setup):

+ set `realitySettings.dest` to:
  + `127.0.0.1:8443`

This makes REALITY “cover traffic” look like it is going to the local nginx TLS service.

---

## 9.9 Client-side change after port sharing

Before port sharing:

+ client connected to `4433`

After port sharing:

+ client port should be `443`
+ everything else stays the same (UUID, publicKey, shortId, SNI, flow, fingerprint)

---

## 9.10 Verification checklist

Server side:

+ nginx works on localhost backend
  + `curl -vk https://127.0.0.1:8443 -H "Host: www.curvature.blog"`

+ Xray listens on 443
  + `ss` shows `*:443`

Public side:

+ normal browser (no VPN) can open:
  + `https://www.curvature.blog`

Client side (V2rayNG):

+ profile connects to `www.curvature.blog:443`
+ traffic works, access log shows accepted connections
+ IP-check site shows VPS IP

---

## 9.11 Quick checklist for this stage

After finishing this section, you should have:

+ Xray listens on public `443`
+ nginx listens on `127.0.0.1:8443` (TLS + HTTP/2 still enabled)
+ Xray fallbacks forward normal HTTPS to nginx correctly
+ REALITY client works on `443`
+ normal users/scanners see only a normal HTTPS website
