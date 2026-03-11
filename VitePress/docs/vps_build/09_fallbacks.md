## Port-sharing 443 with nginx "anti-probing" using fallbacks

In this section, we share port `443` between a normal HTTPS website (nginx) and `VLESS + REALITY + VISION` (Xray).

Goal: when a normal browser visits `https://www.curvature.blog`, it shows the real website; when a REALITY client connects, it works as a proxy.

This creates an "anti-probing" defense: scanners probing port 443 just see a normal HTTPS site.

---

## 9.1 Final architecture (what we want)

We want the final traffic path to look like this:
+ Normal browser traffic:
  - Client -> `443` -> Xray -> fallbacks -> nginx (localhost `8443`) -> website
+ REALITY proxy traffic:
  - Client -> `443` -> Xray (REALITY handshake) -> proxy outbound

Therefore:
+ Xray owns the public port `443`.
+ nginx no longer listens on public `443`.
+ nginx listens only on `localhost 127.0.0.1:8443` (and `[::1]:8443`).
+ Xray forwards normal HTTPS traffic to nginx using its fallbacks mechanism.

---

## 9.2 Move nginx HTTPS to localhost:8443

First, we must get Nginx out of Xray's way. We modified the nginx HTTPS server block in `/etc/nginx/nginx.conf`.
+ change the `listen` lines to restrict Nginx to localhost only :
  ``` 
  server {
    listen 127.0.0.1:8443 ssl http2;
    listen [::1]:8443 ssl http2;
    server_name www.curvature.blog;

    # ... (keep all other ssl_certificate and root settings the same)
  }
  ```
Important notes:
+ nginx still uses the same certificate files.
+ nginx stays HTTPS-enabled (TLS still terminates at nginx on localhost).

After changes:
+ test and reload nginx:
  ``` shell
  sudo nginx -t
  sudo systemctl reload nginx
  ```
  
---

## 9.3 How to test nginx on localhost correctly

After nginx moves to localhost, testing from the outside with `curl https://www.curvature.blog:8443` will fail with `Connection refused` because port 8443 is blocked from the public. This is expected and secure.

Correct test to run from the server's SSH session :
``` shell
curl -vk https://127.0.0.1:8443 -H "Host: www.curvature.blog"
```

If this returns your HTML, the nginx backend is healthy.

---

## 9.4 Common problem: TLS "broken pipe" after moving to 8443

We encountered a specific error when running the local `curl` test:
+ `curl: (35) Send failure: Broken pipe`
+ `OpenSSL SSL_connect: Broken pipe in connection to 127.0.0.1:8443`

Cause:
+ The `listen 127.0.0.1:8443` line was missing the `ssl` parameter .
+ Nginx was treating the port as plain HTTP, but `curl` was speaking HTTPS, causing the handshake to die .

Fix:
+ Ensure the listen lines explicitly include `ssl http2`:
  ``` 
  listen 127.0.0.1:8443 ssl http2;
  listen [::1]:8443 ssl http2;
  ```

---

## 9.5 The Complete Xray Inbound (Port 443 + Fallbacks)

Now that nginx is no longer using public 443, Xray can take it over. We need to update the inbound port and add the `fallbacks` array so normal HTTPS is forwarded to nginx.

Edit your `/usr/local/etc/xray/config.json` so the `vless-reality-vision` inbound exactly matches our working configuration:
```JSON
{
  "log": {
    "loglevel": "info",
    "access": "/var/log/xray/access.log",
    "error": "/var/log/xray/error.log"
  },
  // DNS Setup
  "dns": {
    "servers": [
      "https+local://1.1.1.1/dns-query", // Prevent ISP 
      "localhost"
    ]
  },
  // Routing
  "routing": {
    "domainStrategy": "IPIfNonMatch",
    "rules": [
      
      {
        "type": "field",
        "ip": [
          "geoip:private" 
        ],
        "outboundTag": "block" 
      },
      {
        
        "type": "field",
        "ip": ["geoip:cn"],
        "outboundTag": "block"
      },
      
      {
        "type": "field",
        "domain": [
          "geosite:category-ads-all" 
        ],
        "outboundTag": "block"       }
    ]
  },
  "inbounds": [
    {
      "tag": "vless-reality-vision",
      "listen": "0.0.0.0",
      "port": 443,
      "protocol": "vless",
      "settings": {
        "clients": [
          {
            "id": "YOUR-UUID-HERE",
            "flow": "xtls-rprx-vision"
          }
        ],
        "decryption": "none"
      },
      "streamSettings": {
        "network": "tcp",
        "security": "reality",
        "realitySettings": {
          "show": false,
          "dest": "127.0.0.1:8443",
          "xver": 0,
          "serverNames": [
            "www.curvature.blog"
          ],
          "privateKey": "YOUR-REALITY-PRIVATE-KEY-HERE",
          "shortIds": [
            "YOUR-SHORT-ID-HERE"
          ]
        }
      },
      "fallbacks": [
	    {
      		"name": "www.curvature.blog",
      		"alpn": "h2",
      		"dest": "127.0.0.1:8443"
    	},
    	{
      		"name": "www.curvature.blog",
      		"alpn": "http/1.1",
      		"dest": "127.0.0.1:8443"
    	},
    	{
      		"dest": "127.0.0.1:8443"
    	}
      ]
    }
  ],
  "outbounds": [
    {
      "tag": "direct",
      "protocol": "freedom",
      "settings": {}
    },
    {
      "tag": "block",
      "protocol": "blackhole",
      "settings": {},
      "streamSettings": {}
    }
  ]
}
```
Note: The `fallbacks` array is at the same structural level as `settings` and `streamSettings`, not inside `streamSettings`.

---

## 9.6 Major problem we hit: "connection reset" and SSH lag

Symptom:
+ Browser visiting `https://www.curvature.blog` shows `This site can’t be reached / The connection was reset`.
+ Server SSH became super laggy.
+ Xray `error.log` showed repeated failures:
  `REALITY: failed to dial dest: dial tcp PUBLIC_IP:8443: connect: connection refused`.

Cause (Critical Pitfall):
+ If Xray's fallback `dest` or reality `dest` is written as just `8443`, Xray defaults to the public IP (`PUBLIC_IP:8443`), which is closed .
+ If written as `www.curvature.blog:8443` or `www.curvature.blog:443`, it resolves to the public IP, causing connection resets or an infinite recursion loop back into Xray itself, which maxes out the CPU and lags SSH .

Fix:
+ Set `realitySettings.dest` strictly to the string `"127.0.0.1:8443"`.
+ Set all fallback `dest` fields strictly to the string `"127.0.0.1:8443"`.

---

## 9.7 Restart and Client-side changes

After applying the fixes, restart Xray:
``` shell
sudo systemctl restart xray
```

Before port sharing, the client connected to `4433`. Now, we update the client profile (e.g., V2rayNG):
+ Port: Change to `443`.
+ Everything else stays exactly the same (UUID, publicKey, shortId, SNI, flow, fingerprint).

---

## 9.8 Verification checklist

Server side:
+ nginx works on localhost backend:
  `curl -vk https://127.0.0.1:8443 -H "Host: www.curvature.blog"`
+ Xray listens on 443:
  `sudo ss -tuln | grep 443` (should show `*:443` and `127.0.0.1:8443`)

Public side:
+ A normal browser (no VPN) can open `https://www.curvature.blog` and see the real website.

Client side (V2rayNG):
+ Profile connects to `www.curvature.blog` on port `443`.
+ Traffic works, and the server's `access.log` shows accepted connections.
+ IP-check site on your phone shows the VPS IP.

