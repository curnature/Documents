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
            "id": "a50401a4-dc01-4ad6-8add-26204978ab48",
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
          "privateKey": "EOM_0M2Sw-MS36GXmb0uU3M9EC_LYApCNUskI7qfymc",
          "shortIds": [
            "2113c642196d5046"
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