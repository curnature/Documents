## Overview

Let's establish a step-by-step guide towards a personal VPS server that runs with 
+ Debian 12 + BBR
+ nginx TLS 1.3 + HTTP/2 on port 8443
+ Xray VLESS + REALITY + VISION on port 443
+ port sharing with fallbacks
+ Routing + DoH 
+ Clients on PC and Android 

Special Thanks to `https://xtls.github.io/document/`! This note basically follows this page, together with the help of ChatGPT to fix some specific problems.

---

## Prerequisite

+ Get a Debian 12 VPS server (I use VMISS and BBR is turned on by default)
+ Get a domain (ex. `www.curvature.blog`), and A-record to the VPS IP