## Create a non-root user

For security, we would like to login in to `SSH` via a non-root user
+ ``` shell
  adduser vpsadmin
  ```
  set password
+ install `sudo`
  ``` shell
  apt update
  apt install sudo
  ```
+ add `vpsadmin` to `sudo` list
  ```
  visudo
  ```
  under `User Privilege Specification`, add
  ```
  vpsadmin ALL=(ALL) NOPASSWD: ALL
  ```
+ save and exit

---

## Switch SSH login port

+ ``` shell
  vim /etc/ssh/sshd_config
  ```
+ pick a number from $1024 < P < 65535$, and set it as your port
+ save and exit
+ restart ssh service
  ```
  systemctl restart ssh
  ```