## Xray config
`/usr/local/etc/xray/config.json`
``` json
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
            "id": "your_id",
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
            "your.domain.name"
          ],
          "privateKey": "your_private_key",
          "shortIds": [
            "your_short_ids"
          ]
        }
      },
      "fallbacks": [
        {
                "name": "your.domain.name",
                "alpn": "h2",
                "dest": "127.0.0.1:8443"
        },
        {
                "name": "your.domain.name",
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