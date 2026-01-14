## Nginx config
`/etc/nginx/nginx.conf`
``` nginx
user www-data;
worker_processes auto;
pid /run/nginx.pid;
error_log /var/log/nginx/error.log;
include /etc/nginx/modules-enabled/*.conf;

events {
        worker_connections 768;
        # multi_accept on;
}

http {

        ##
        # Basic Settings
        ##

        sendfile on;
        tcp_nopush on;
        types_hash_max_size 2048;
        # server_tokens off;

        # server_names_hash_bucket_size 64;
        # server_name_in_redirect off;

        include /etc/nginx/mime.types;
        default_type application/octet-stream;

        ##
        # SSL Settings
        ##

        ssl_protocols TLSv1 TLSv1.1 TLSv1.2 TLSv1.3; # Dropping SSLv3, ref: POODLE
        ssl_prefer_server_ciphers on;

        ##
        # Logging Settings
        ##

        access_log /var/log/nginx/access.log;

        ##
        # Gzip Settings
        ##

        gzip on;

        # gzip_vary on;
        # gzip_proxied any;
        # gzip_comp_level 6;
        # gzip_buffers 16 8k;
        # gzip_http_version 1.1;
        # gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

        ##
        # Virtual Host Configs
        ##

        include /etc/nginx/conf.d/*.conf;
        include /etc/nginx/sites-enabled/*;

        ##
        # Server Settings
        ##

        server {
                listen 80;
                listen [::]:80;
                server_name your.domain.name;
                return 301 https://$host$request_uri;
        }

        server {
                listen 127.0.0.1:8443 ssl http2;
                listen [::1]:8443 ssl http2;

                server_name your.domain.name;

                root /var/www/html;
                index index.nginx-debian.html index.html;

                ssl_certificate     /etc/nginx/cert/your.own.fullchain.cer;
                ssl_certificate_key /etc/nginx/cert/your.own.key;

                ssl_protocols TLSv1.3;
                ssl_prefer_server_ciphers off;

                # (Optional, but fine)
                ssl_ecdh_curve X25519:secp256r1;

                add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;

                location / {
                        try_files $uri $uri/ =404;
                }
        }

}


#mail {
#       # See sample authentication script at:
#       # http://wiki.nginx.org/ImapAuthenticateWithApachePhpScript
#
#       # auth_http localhost/auth.php;
#       # pop3_capabilities "TOP" "USER";
#       # imap_capabilities "IMAP4rev1" "UIDPLUS";
#
#       server {
#               listen     localhost:110;
#               protocol   pop3;
#               proxy      on;
#       }
#
#       server {
#               listen     localhost:143;
#               protocol   imap;
#               proxy      on;
#       }
#}
```