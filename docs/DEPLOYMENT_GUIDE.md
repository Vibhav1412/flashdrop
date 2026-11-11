# FlashDrop: Production Deployment & Infrastructure Runbook

---

## 1. System Requirements & Ports

| Component | Minimum Specs | Recommended Specs | Listening Port |
| :--- | :--- | :--- | :---: |
| **Node.js (Next.js)** | 2 vCPU, 2 GB RAM | 4 vCPU, 4 GB RAM | `3000` |
| **MySQL 8.0** | 2 vCPU, 4 GB RAM | 8 vCPU, 16 GB RAM | `3306` |
| **Redis 7.2** | 1 vCPU, 1 GB RAM | 2 vCPU, 4 GB RAM | `6379` |

---

## 2. Linux Systemd Unit Files

### 2.1 Next.js Web Engine (`/etc/systemd/system/flashdrop-web.service`)
```ini
[Unit]
Description=FlashDrop Next.js Commerce Application
After=network.target mysql.service redis-server.service

[Service]
Type=simple
User=flashdrop
WorkingDirectory=/opt/flashdrop/app
Environment=NODE_ENV=production
Environment=PORT=3000
ExecStart=/usr/bin/npm start
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
```

---

## 3. Nginx Reverse Proxy & SSL Termination

```nginx
server {
    listen 80;
    server_name drop.flashdrop.io;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name drop.flashdrop.io;

    ssl_certificate /etc/letsencrypt/live/drop.flashdrop.io/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/drop.flashdrop.io/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 4. Disaster Recovery & Snapshot Playbook

### 4.1 Daily Relational Dump
```bash
mysqldump -u flashdrop_admin_user -padmin_secure_pass_123 --no-tablespaces --routines --triggers flashdrop | gzip > /backups/mysql/flashdrop_$(date +%Y%m%d).sql.gz
```

### 4.2 Redis Append-Only File (AOF) Compaction
```bash
redis-cli BGREWRITEAOF
```
