## VLESS + REALITY + VISION working (first on non-443 port)

In this section, we create a minimal Xray configuration for `VLESS + REALITY + VISION` and make it work first on a non-443 port (e.g., `4433`).

Goal: the client (Android V2rayNG) can connect, and the server `access.log` shows traffic.

---

## 6.1 Decide the first test port and open firewall

Before sharing port 443 with nginx, we first test Xray on a dedicated port to isolate any configuration issues .

+ pick a test port (example: `4433`)
+ ensure this port is allowed in your firewall:
  ``` shell
  sudo ufw allow 4433/tcp
  ```

---

## 6.2 Generate REALITY keys (x25519)

REALITY requires an x25519 key pair. Note: Newer Xray versions use confusing terminology in their output .

+ generate the keys:
  ``` shell
  /usr/local/bin/xray x25519
  ```
+ the output will look like this :
  ``` shell
  PrivateKey: EOM_0M2Sw-MS36GXmb0uU3M9EC_LYApCNUskI7qfymc
  Password: BwtllsQkQMFpO8e6qZTlxqTarXN4WzzwS2X70zceRjo
  Hash32: X7qELoC81uimK7b9_cKGUquKVp4vQaQNT54PSmcNR_8
  ```
Crucial Mapping:

+ `PrivateKey` goes into the server config (`realitySettings.privateKey`) .
+ `Password` is actually your Public Key. This goes into the client config as `PublicKey` .
+ `Hash32` is ignored (it is just for verification).

---

## 6.3 Prepare UUID and shortId

VLESS requires a UUID for client identity, and REALITY requires a `shortId`.

+ generate a UUID :
  ``` shell
  /usr/local/bin/xray uuid
  ```
  (Save this for both server and client configs).
+ generate a `shortId` (an 8-16 character hex string) :
  ``` shell
  openssl rand -hex 8
  ```
  (Example output: 2113c642196d5046. Save this for both server and client configs).

---

## 6.4 The Minimal Inbound Configuration

We will completely replace the default `/usr/local/etc/xray/config.json` with a clean configuration .

Note: At this stage, `dest` points to `www.curvature.blog:443` because Nginx is still occupying port 443. We will change this later when we implement port-sharing .

+ edit the config:
  ``` shell
  sudo vim /usr/local/etc/xray/config.json
  ```
+ insert the following JSON, replacing the dummy values with your generated `UUID`, `PrivateKey`, and `shortId` :
  ``` JSON
  {
    "log": {
      "loglevel": "info",
      "access": "/var/log/xray/access.log",
      "error": "/var/log/xray/error.log"
    },
    "inbounds": [
      {
        "tag": "vless-reality-vision",
        "listen": "0.0.0.0",
        "port": 4433,
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
            "dest": "www.curvature.blog:443",
            "xver": 0,
            "serverNames": [
              "www.curvature.blog"
            ],
            "privateKey": "YOUR-REALITY-PRIVATE-KEY-HERE",
            "shortIds": [
              "YOUR-SHORT-ID-HERE"
            ]
          }
        }
      }
    ],
    "outbounds": [
      {
        "tag": "direct",
        "protocol": "freedom",
        "settings": {}
      },
      {
        "tag": "blocked",
        "protocol": "blackhole",
        "settings": {}
      }
    ]
  }
  ```

---

## 6.5 Restart and confirm listening

After editing the configuration, apply it and verify.

+ restart service:
  ``` shell
  sudo systemctl restart xray
  sudo systemctl status xray
  ```
+ confirm it is listening on port `4433` :
  ``` shell
  sudo ss -tulpn | grep xray
  ```

---

## 6.6 Client setup (Android V2rayNG)

On Android, create a new profile with the following parameters :

Basics: 
+ Type/Protocol: `VLESS`
+ Address/Host: `www.curvature.blog`
+ Port: `4433`
+ UUID: (must match server)
+ Encryption: none
+ Network/Transport: `tcp`
+ Flow: `xtls-rprx-vision`

Security / REALITY section:
+ Security: `reality`
+ SNI / ServerName: `www.curvature.blog`
+ PublicKey: (Use the Password output from xray x25519)
+ ShortId: (must match server)
+ Fingerprint: `chrome` (or another common browser)
+ AllowInsecure: `false` or `off`
+ SpiderX: (leave empty or `/`)
+ Mux: `off` (keep off for simpler debugging)

---

# 6.7 How we verified it works

Server side :

+ watch access log:
  ``` shell
  sudo tail -f /var/log/xray/access.log
  ```

Client side :
+ With V2rayNG turned ON (VPN key icon visible), visit an IP-check website (like `https://ifconfig.me`). It should show your VPS public IP, not your home/cellular IP.
+ As you browse, new lines should appear in the server's `access.log`.

---

## 6.8 Common problems we encountered (and fix)

+ Problem: V2rayNG shows error `io: read/write on closed pipe`, and browser shows "DNS problem" .
+ Accompanying Server Error: `/var/log/xray/error.log` shows `REALITY: processed invalid connection ... authentication failed or validation criteria not met` .
  - Cause: The client reached the server on 4433, but the REALITY handshake failed due to a parameter mismatch .
  - Fix: Strictly double-check that the `UUID`, `shortId`, and `serverName` match exactly. Ensure you put the `PrivateKey` on the server and the `Password` (PublicKey) on the client .
+ Problem: Server `access.log` shows nothing .
  - Cause: Client never reached server (port blocked, DNS wrong, service not listening) or handshake failed instantly.
  - Fix: Confirm listening with `ss -tuln`, check UFW firewall rules, and monitor `/var/log/xray/error.log` .

---

## 6.9 Quick checklist for this stage

After finishing this section, you should have:

+ Xray inbound running actively on dedicated port `4433`.
+ A syntactically correct `config.json` with REALITY parameters filled out.
+ Android V2rayNG configured and connecting successfully.
+ Server `access.log` showing accepted connections.
+ Browsing through the VPN works and successfully masks your local IP.