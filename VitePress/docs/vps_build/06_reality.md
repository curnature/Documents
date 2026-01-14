## VLESS + REALITY + VISION working (first on non-443 port)

In this section, we create a minimal Xray configuration for `VLESS + REALITY + VISION` and make it work first on a non-443 port (e.g. `4433`).  
Goal: the client (Android V2rayNG) can connect, and the server `access.log` shows traffic.

---

## 6.1 Decide the first test port

Before sharing port 443 with nginx, we first tested Xray on a dedicated port:

+ pick a test port (example: `4433`)
+ ensure this port is allowed in firewall / provider rules (if you use one)
+ verify the service is listening after restart

---

## 6.2 Generate REALITY keys (x25519)

REALITY needs an x25519 key pair:

+ server uses `PrivateKey`
+ client uses the printed `Password` as the `PublicKey` (naming is confusing)

We used:

+ ``` shell
  /usr/local/bin/xray x25519
  ```

Output includes:

+ `PrivateKey: ...`
+ `Password: ...`
+ `Hash32: ...`

Important notes:

+ `PrivateKey` goes into server config (`realitySettings.privateKey`)
+ `Password` goes into client config as `publicKey`
+ `Hash32` is optional (not required for basic setup)

---

## 6.3 Prepare UUID and shortId

VLESS requires a UUID for client identity:

+ generate a UUID (any standard method works)
+ add it into:
  + server: `settings.clients[].id`
  + client: UUID field

REALITY also needs a `shortId`:

+ it is a short hex string (usually 8 or 16 bytes in hex)
+ must match on server and client
+ we used a 16-hex style shortId (example):
  ```
  2113c642196d5046
  ```

---

## 6.4 Minimal inbound structure (concept)

The inbound looks like:

+ protocol: `vless`
+ port: `4433` (first test)
+ stream security: `reality`
+ flow: `xtls-rprx-vision`
+ serverNames / SNI should be your domain (example: `www.curvature.blog`)

Key idea:

+ REALITY tries to look like a real TLS connection to a normal site
+ so we use a normal domain name as the “cover” (`serverNames`)

---

## 6.5 Restart and confirm listening

After editing `/usr/local/etc/xray/config.json`:

+ test config indirectly by restarting service
+ ``` shell
  sudo systemctl restart xray
  ```

+ confirm it is listening on the port
+ ``` shell
  sudo ss -tulpn | grep xray
  ```

---

## 6.6 Client setup (Android V2rayNG)

On Android:

+ create a new profile
+ protocol: `VLESS`
+ address: `www.curvature.blog`
+ port: `4433` (first test port)
+ UUID: same as server

Transport / Reality fields:

+ security: `reality`
+ flow: `xtls-rprx-vision`
+ SNI / serverName: `www.curvature.blog`
+ publicKey: use `Password` from `xray x25519`
+ shortId: must match server
+ fingerprint: we used `chrome` (common choice)

---

## 6.7 How we verified it works

Server side:

+ watch access log
+ ``` shell
  sudo tail -f /var/log/xray/access.log
  ```

Client side:

+ V2rayNG connection test succeeds
+ browser / app traffic works normally through VPN
+ visiting an IP-check website shows the VPS IP

---

## 6.8 Common problems we encountered (and fix)

+ problem: V2rayNG shows error `io: read/write on closed pipe`
  + common causes:
    + client/server mismatch in REALITY parameters
    + wrong port
    + wrong `publicKey` / `shortId` / UUID
    + wrong SNI / serverName
  + fix:
    + re-check **all** fields match:
      + UUID (server + client)
      + server `privateKey` vs client `publicKey` (Password)
      + `shortId`
      + `serverName` / SNI
      + port
    + watch server error log for hints

+ problem: server `access.log` shows nothing
  + cause:
    + client never reached server (port blocked, DNS wrong, service not listening)
    + handshake failed early (wrong keys / SNI)
  + fix:
    + confirm listening (`ss`)
    + check provider firewall
    + check `/var/log/xray/error.log`

+ problem: DNS issues on client
  + often a side-effect of the tunnel not being established correctly
  + fix:
    + solve the REALITY handshake first (keys/port/SNI)
    + then DNS usually works automatically

---

## 6.9 Quick checklist for this stage

After finishing this section, you should have:

+ Xray inbound running on a dedicated port (example: `4433`)
+ Android V2rayNG connects successfully
+ server `access.log` shows accepted connections
+ browsing through VPN works and shows VPS IP
