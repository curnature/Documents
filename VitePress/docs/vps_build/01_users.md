## Create a non-root user

For security, we would like to login in `SSH` via a non-root user
+ ``` shell
  adduser vpsadmin
  ```
  set password and follow prompts

+ install `sudo`
  ``` shell
  apt update
  apt install sudo
  ```
+ add `vpsadmin` to `sudo` list
  ``` shell
  visudo
  ```
  under `User Privilege Specification`, add
  ```
  vpsadmin ALL=(ALL) NOPASSWD: ALL
  ```
+ save `Ctrl + o`and exit `Ctrl + x` (in nano)

---

## Switch SSH login port

+ ``` shell
  vim /etc/ssh/sshd_config
  ```
+ pick a number from $1024 < P < 65535$, and set it as your port
+ find `#Port 22`, uncomment it, and change it to your port
  - example:
    ```
    Port 3145
    ```
+ save `:w` and exit `:q` (in vim)
  ``` vim
  :wq
  ```
+ restart ssh service
  ``` shell
  systemctl restart ssh
  ```
+ (important) test the new port before closing your current ssh session
  - open a new terminal on your local machine and try:
    ``` shell
    ssh -p 3145 vpsadmin@YOUR_SERVER_IP
    ```
  - if it fails, do **not** logout from the old session (check firewall / provider rules first)