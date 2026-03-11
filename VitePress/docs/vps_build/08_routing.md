## More on Xray - Routing and DNS

In this section, we configure Xray's internal routing to control how outbound traffic is handled.

Goal: Block ads, restrict access to local LAN IP addresses for security, prevent connections to specific regions, and secure our DNS queries.

---

## 8.1 The Concept of Routing and Outbounds

Xray evaluates every connection passing through the proxy against a set of `rules` in the `routing` object. Depending on what rule is matched, the traffic is sent to a specific `outboundTag`.

To make routing work, we must define at least two outbounds :
+ `direct` (protocol: `freedom`): This is the default exit to the normal internet.
+ `block` (protocol: `blackhole`): Any traffic sent here is instantly dropped.

---

## 8.2 Our Specific Routing Rules Explained

Our setup uses three main blocking rules :

+ Block Private IPs (`geoip:private`)
  - This blocks destinations like `10.0.0.0/8`, `172.16.0.0/12`, and `192.168.0.0/16`.
  - Why: For a VPS proxy, this is a security measure. It prevents the proxy from being used to probe the server's internal local network. Note that while connected to the VPN, you won't be able to reach your home router's local web GUI through the tunnel.
+ Block specific regions (`geoip:cn`)
  - Any destination whose IP falls within China's IP ranges is immediately blackholed.
  - Why: If your goal is to strictly prevent traffic to/from CN servers while on the proxy, this rule enforces it. (Remove this rule if you ever want to access those sites through the VPS).
+ Block Ads and Trackers (`geosite:category-ads-all`)
  - This uses Xray's built-in `geosite.dat` file to drop connections to known ad and tracker domains.
  - Why: Less tracking and cleaner browsing. (Note: If a webpage breaks or only half-loads, it might be because this rule blocked a required tracking script).

Any traffic that does not match these three block rules simply flows out via the default `direct` outbound.

---

## 8.3 DNS Configuration (DoH)

To prevent the VPS's Internet Service Provider (ISP) from snooping on the domains you visit, we force Xray to resolve DNS queries securely using DNS-over-HTTPS (DoH).
+ We set the primary DNS server to Cloudflare's DoH: `https+local://1.1.1.1/dns-query`.
+ We use `localhost` as a fallback.
---

## 8.4 The Complete Routing JSON Snippet

Here are the `dns`, `routing`, and `outbounds` objects that go into your `/usr/local/etc/xray/config.json` (placed alongside `log` and `inbounds`) :
``` JSON
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
```

---

## 8.5 Quick checklist for this stage

After applying these blocks to your configuration:
+ Xray must securely resolve domains via `1.1.1.1` DoH.
+ Local network addresses (`192.168.x.x`, etc.) are blocked through the proxy.
+ Ads and trackers are blackholed.
+ `sudo systemctl restart xray` runs without syntax errors.