## Enable BBR correctly (second run)

In this section, we verify and enable TCP BBR (Bottleneck Bandwidth and Round-trip propagation time) on Debian 12.

Goal: confirm the kernel supports BBR and it is actually in use to optimize proxy network speeds.
---

## 7.1 Background: what went wrong before

We previously tried a risky approach meant for older Debian versions:

+ adding an old backports source (`buster-backports`) to `/etc/apt/sources.list` .
+ installing a different kernel from that source.
+ rebooting.

Result:

+ system behavior became unstable; SSH broke, returning `Connection refused`, and the custom SSH port was unexpectedly wiped out and reset to 22 .
+ conclusion: do **NOT** mix old Debian backports on Debian 12 just to get BBR.

So we switched to the correct approach:
+ use the Debian 12 kernel as-is. Debian 12's stock kernel already supports BBR natively.

---

## 7.2 Verify BBR is available

We checked the current congestion control:
``` shell
sudo sysctl net.ipv4.tcp_congestion_control
```

We also checked what algorithms are available:
``` shell
sudo sysctl net.ipv4.tcp_available_congestion_control
```

Expected output pattern:
+ available includes `bbr` (e.g., `reno cubic bbr`).
+ current is `bbr` (or you can switch to it).

---

## 7.3 Common problem: `sysctl: command not found`

When running the checks without `sudo`, we saw :
+ `-bash: sysctl: command not found`

Cause:
+ `sysctl` is located in `/usr/sbin/`, which is usually not in a normal user's `$PATH` .

Fix:
+ run the command with `sudo`, which includes `/usr/sbin` in its path.
+ if the binary is truly missing, install the `procps` package :
  ``` shell
  sudo apt update
  sudo apt install -y procps
  ```

---

## 7.4 Enable BBR via sysctl config (The Modern Way)

Instead of editing the main `/etc/sysctl.conf` directly, it is best practice on modern Debian to drop a clean file into `/etc/sysctl.d/` .

+ create the configuration file and add the BBR parameters :
  ``` shell
  echo "net.core.default_qdisc=fq" | sudo tee /etc/sysctl.d/99-bbr.conf
  echo "net.ipv4.tcp_congestion_control=bbr" | sudo tee -a /etc/sysctl.d/99-bbr.conf
  ```
+ apply the settings without needing to reboot :
  ``` shell
  sudo sysctl --system
  ```
+ verify BBR is loaded :
  ``` shell
  lsmod | grep bbr
  ```
  (Note: It usually loads automatically when first used, so don't worry if it doesn't show up immediately ).

---

## 7.5 Quick checklist for this stage

After finishing this section, you should have:

+ Verified that the stock Debian 12 kernel supports `bbr`.
+ Confirmed `tcp_available_congestion_control` includes `bbr`.
+ Confirmed `tcp_congestion_control` is actively set to `bbr`.
+ A dedicated `/etc/sysctl.d/99-bbr.conf` file ensuring BBR persists across reboots.
+ Avoided any risky backports or kernel mixing.