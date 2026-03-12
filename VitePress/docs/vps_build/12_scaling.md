## Scaling with Multiple Nodes (Pure Xray)

In this section, we set up a second VPS (Server 2) to act as an additional proxy node.

Goal: Server 2 will use pure Xray without installing Nginx or website files. It will use the VitePress site on Server 1 (`www.curvature.blog`) as its REALITY camouflage across the internet.

---

## 12.1 The Multi-Node Architecture

The REALITY protocol does not require the decoy website to be hosted on the same server. We can use this to our advantage to easily spin up new proxy nodes around the world.
+ Server 1 (Primary): Hosts the real VitePress website via Nginx at `www.curvature.blog` (DNS points here).
+ Server 2 (New Node): Only has Xray installed. Listens on port 443.

How it handles traffic:
+ If your client connects with the correct keys, Server 2 acts as a proxy.
+ If a censor or scanner probes Server 2's IP on port 443, Xray silently forwards that connection across the internet to `www.curvature.blog:443` (Server 1).
+ Server 1 replies with the real VitePress website and a valid TLS certificate. The censor sees a normal blog and leaves Server 2 alone.

---

## 12.2 What Server 2 Needs (and Doesn't Need)

Because Server 2 is just a transparent middleman, the setup is incredibly fast.
+ <span style="color: red;">DO NOT INSTALL</span>: Nginx, `acme.sh`, TLS certificates, or VitePress.
+ <span style="color: red;">DO NOT USE</span>: The `fallbacks` array in the Xray config (there is no local Nginx to fall back to).
+ <span style="color: green;">DO USE</span>: The `routing` rules and `dns` blocks (so your proxy traffic still benefits from ad-blocking, DoH, and private IP protection).

---

## 12.3 Generate New Keys for Server 2

Every distinct server node needs its own cryptographic identity. Do not copy the keys from Server 1.
+ Generate a new REALITY key pair on Server 2:
  ``` shell
  /usr/local/bin/xray x25519
  ```
  (Save the `PrivateKey` for the server config, and the `Password` for your client).
+ Generate a new `shortId` on Server 2:
  ``` shell
  openssl rand -hex 8
  ```
(Note: You can reuse the same `UUID` from Server 1 for your client identity to keep things simple).

---

## 12.4 The Server 2 config.json

We replace the default `/usr/local/etc/xray/config.json` on Server 2 with the following. Notice that the `realitySettings.dest` points directly to the public internet address of Server 1, and the `fallbacks` array is completely gone.
``` JSON
{
  "log": {
    "loglevel": "info",
    "access": "/var/log/xray/access.log",
    "error": "/var/log/xray/error.log"
  },
  "dns": {
    "servers": [
      "https+local://1.1.1.1/dns-query",
      "localhost"
    ]
  },
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
        "ip": [
          "geoip:cn"
        ],
        "outboundTag": "block"
      },
      {
        "type": "field",
        "domain": [
          "geosite:category-ads-all"
        ],
        "outboundTag": "block"
      }
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
          "dest": "www.curvature.blog:443",
          "xver": 0,
          "serverNames": [
            "www.curvature.blog"
          ],
          "privateKey": "SERVER-2-NEW-PRIVATE-KEY",
          "shortIds": [
            "SERVER-2-NEW-SHORT-ID"
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
      "tag": "block",
      "protocol": "blackhole",
      "settings": {}
    }
  ]
}
```

Restart Xray to apply the changes:
``` shell
sudo systemctl restart xray
```

---

## 12.5 Client Setup for Server 2 (V2rayNG)

The global DNS for www.curvature.blog still points to Server 1. To connect to Server 2, we must force the client to physically travel to Server 2's IP address.

Create a new profile in V2rayNG:
+ Address (Host): [Server 2's Raw Public IP Address]
+ Port: 443
+ UUID: (Matches the UUID in Server 1's config)
+ Flow: xtls-rprx-vision
+ Security: reality
+ SNI / ServerName: www.curvature.blog
+ PublicKey: (The new Password output from Server 2's x25519 command)
+ ShortId: (The new shortId generated on Server 2)
+ Fingerprint: chrome

When you connect, the app travels directly to Server 2's IP address but announces, "I am looking for www.curvature.blog." Server 2 intercepts it, verifies the keys, and grants proxy access.

---

## 12.6 Quick checklist for this stage

After finishing this section, you should have:
+ A lightweight secondary Xray node running without Nginx or certificates.
+ Routing rules intact on Server 2 to preserve ad-blocking and DoH.
+ A `realitySettings.dest` actively forwarding non-client traffic to Server 1.
+ A new V2rayNG profile that points to Server 2's IP but uses Server 1's SNI.

