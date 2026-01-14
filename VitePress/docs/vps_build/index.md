## Overview

Let's establish a step-by-step guide towards a personal VPS server that runs with 
+ Debian 12 + BBR
+ nginx TLS 1.3 + HTTP/2 on port 8443
+ Xray VLESS + REALITY + VISION on port 443
+ port sharing with fallbacks
+ Routing
+ Clients on PC and Android 

Special Thanks to [this tutorial](https://xtls.github.io/document/)! This note basically follows it, together with the help of ChatGPT to fix some specific problems that does not show up in the tutorial.

---

## Prerequisite

+ Get a Debian 12 VPS server (I use VMISS and BBR is turned on by default)
  - You need `IPs` - `Port: 22` - `Username: root` - `Password: ***`
+ Get a domain (I use porkbun and get `www.curvature.blog`) and point DNA A record to the VPS IP
  - `DNS` - `Type A` - `Host: www.curvature.blog` - `Auswer: your server IP` - `TTL: 600(default)`
+ `SSH` login in your server
+ update all the packages for the first time
  ``` shell
  apt update
  apt upgrade
  ```
---

Up to this point, we have a server, a domain, and we have upgrade all the packages.