## Automating VitePress via GitHub Actions

In this section, we replace the default Nginx page with a VitePress documentation site. We automate the deployment so that pushing to the GitHub repository automatically builds the site and sends it to the VPS.

Goal: When a normal browser visits `https://www.curvature.blog`, it displays the VitePress site seamlessly served by Nginx on localhost, fully automated via GitHub Actions.

---

## 11.1 Update VitePress config for root hosting

Previously, the site was hosted on GitHub Pages, which required a subfolder path. Since we are moving it to the root of our own domain, we must remove that path.
+ Edit `config.mts` in the repository.
+ Change or remove the `base` property so it points to the root:
  ``` TypeScript
  export default defineConfig({
  base: '/', 
  title: 'Documents',
  // ...
  })
  ```

---

## 11.2 Generate a dedicated deployment SSH key

GitHub Actions needs a secure way to log into the VPS without a password. We generate a dedicated SSH key pair for this.
+ Run the keygen command (do not enter a passphrase, just press Enter twice):
  ``` shell
  ssh-keygen -t ed25519 -C "github-actions-deploy" -f deploy_key
  ```
+ This creates two files:
  - `deploy_key` (Private Key - goes to GitHub)
  - `deploy_key.pub` (Public Key - goes to the VPS)

---

## 11.3 Add the Public Key to the VPS (and fix E212 error)

We need to authorize the new key on the VPS for the `vpsadmin` user.
+ Problem: When trying to edit `~/.ssh/authorized_keys`, Vim threw an error: `E212: Can't open file for writing`.
  - Cause: The `vpsadmin` user was newly created, so the hidden `.ssh` directory did not exist yet. Vim cannot create directories automatically.
  - Fix: Exit Vim (`:q!`), create the directory manually, and lock down the permissions:
    ``` shell
    mkdir -p ~/.ssh
    chmod 700 ~/.ssh
    ```
+ Now, open the file:
  ``` shell
  vim ~/.ssh/authorized_keys
  ```
+ Paste the contents of `deploy_key.pub` on a new line, save, and exit.
+ Secure the file permissions:
  ``` shell
  chmod 600 ~/.ssh/authorized_keys
  ```
+ Finally, ensure `vpsadmin` actually owns the Nginx web directory so GitHub can write to it:
  ``` shell
  sudo chown -R vpsadmin:vpsadmin /var/www/html
  ```

---

## 11.4 Configure GitHub Secrets securely

To let the GitHub Action log in, we must pass it the server details and the private key.
+ Problem: We initially tried pasting all the variables into a single GitHub Secret box.
  - Cause: GitHub Actions requires explicit, separate variables to read them correctly in the YAML file.
  - Fix: In the GitHub repository (Settings > Secrets and variables > Actions), create four distinct secrets:
    + `SERVER_IP`: `YOUR_VPS_IP`
    + `SERVER_PORT`: `3145`
    + `SERVER_USER`: `vpsadmin`
    + `DEPLOY_KEY`: (The entire contents of `deploy_key`, including the `BEGIN` and `END` lines)

---

## 11.5 The GitHub Actions Workflow

We replaced the GitHub Pages deployment step with an `rsync` SSH deployment step.
+ Create or update `.github/workflows/deploy.yml`:
  ``` YAML
  name: Deploy VitePress to VPS

  on:
    push:
      branches: [main]
    workflow_dispatch:

  jobs:
    build-and-deploy:
      runs-on: ubuntu-latest
      timeout-minutes: 15
      steps:
        - name: Checkout
          uses: actions/checkout@v4

        - name: Setup Node
          uses: actions/setup-node@v4
          with:
            node-version: 20
            cache: npm
            cache-dependency-path: VitePress/package-lock.json

        - name: Install dependencies
          working-directory: VitePress
          run: npm ci

        - name: Build site
          working-directory: VitePress
          run: npm run docs:build

        - name: Deploy to VPS via rsync
          uses: easingthemes/ssh-deploy@main
          env:
            SSH_PRIVATE_KEY: ${{ secrets.DEPLOY_KEY }}
            REMOTE_HOST: ${{ secrets.SERVER_IP }}
            REMOTE_USER: ${{ secrets.SERVER_USER }}
            REMOTE_PORT: ${{ secrets.SERVER_PORT }}
            SOURCE: "VitePress/docs/.vitepress/dist/"
            TARGET: "/var/www/html/"
  ```
(Important: The trailing slash on the `SOURCE` path ensures we copy the files inside the folder, not the folder itself).

---

11.6 Fix Nginx displaying the wrong page

After a successful GitHub Action run, the website still showed the default Nginx welcome page.
+ Problem: The default page was overriding the VitePress `index.html`.
  - Cause: Debian's default Nginx installation places a "squatter" file named `index.nginx-debian.html` in the root directory.
  - Fix: Rename or remove the squatter file so Nginx is forced to load the new VitePress index:
    ``` shell
    sudo mv /var/www/html/index.nginx-debian.html /var/www/html/index.nginx-debian.html.bak
    ```

---

## 11.7 Fix Nginx 404 errors for Clean URLs

When clicking internal links (like `/vps_build/01_users`), Nginx returned a `404 Not Found` error.
+ Cause: VitePress generates clean URLs but actually builds `.html` files. Nginx was looking for a directory named `01_users` instead of `01_users.html`.
+ Fix: Update the Nginx configuration to silently try `.html` extensions.
  - Edit the config:
    ``` shell
    sudo vim /etc/nginx/nginx.conf
    ```
  - In the `server` block listening on `127.0.0.1:8443`, update the `location /` directive to include `$uri.html`:
    ``` 
    location / {
    try_files $uri $uri/ $uri.html =404;
    }
    ```
  - Test and reload:
    ``` shell
    sudo nginx -t
    sudo systemctl reload nginx
    ```

---

## 11.8 Quick checklist for this stage

After finishing this section, you should have:
+ A VitePress `config.mts` set to the root base `/`.
+ A dedicated `deploy_key` stored securely in GitHub Secrets.
+ `vpsadmin` owning the `/var/www/html` directory.
+ A `.github/workflows/deploy.yml` that successfully uses `rsync` to push the site on every commit.
+ An Nginx configuration that properly handles `.html` clean URLs.
