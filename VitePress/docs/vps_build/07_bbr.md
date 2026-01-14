## Enable BBR correctly (second run)

In this section, we verify and enable TCP BBR on Debian 12.  
Goal: confirm the kernel supports BBR and it is actually in use.

---

## 7.1 Background: what went wrong before

We previously tried a risky approach:

+ adding an old backports source (e.g. `buster-backports`)
+ installing a different kernel from that source
+ rebooting

Result:

+ system behavior became unstable (SSH issues after reboot, port changed unexpectedly)
+ conclusion: do **NOT** mix old Debian backports on Debian 12 just to get BBR

So we switched to the correct approach:

+ use Debian 12 kernel as-is
+ verify whether BBR is already supported (it usually is)

---

## 7.2 Verify BBR is available

We checked the current congestion control:

+ ``` shell
  sudo sysctl net.ipv4.tcp_congestion_control
  ```

We also checked what algorithms are available:

+ ``` shell
  sudo sysctl net.ipv4.tcp_available_congestion_control
  ```

Expected output pattern:

+ available includes `bbr`
+ current is `bbr` (or you can switch to it)

---

## 7.3 Common problem: `sysctl: command not found`

We saw:

+ `-bash: sysctl: command not found`

Cause:

+ `sysctl` is located in `/usr/sbin/`, which is not always in a normal user's `PATH`
+ also, we were running without sudo

Fix:

+ run with `sudo` (recommended)
+ or use full path `/usr/sbin/sysctl`

Also confirm `procps` is installed:

+ ``` shell
  sudo apt install procps
  ```

---

## 7.4 Enable BBR via sysctl config (if not already enabled)

If BBR is available but not enabled by default, add these lines:

+ edit sysctl config
+ ``` shell
  sudo vim /etc/sysctl.conf
  ```

+ add:
  ```
  net.core.default_qdisc=fq
  net.ipv4.tcp_congestion_control=bbr
  ```

Apply:

+ ``` shell
  sudo sysctl -p
  ```

Then re-check with section 7.2 commands.

---

## 7.5 Quick checklist for this stage

After finishing this section, you should have:

+ Debian 12 kernel supports `bbr`
+ `tcp_available_congestion_control` includes `bbr`
+ `tcp_congestion_control` is set to `bbr`
+ no risky backports kernel mixing
