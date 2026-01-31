# Configuracion de Nginx para ROADMAP-KIT

Esta guia explica como configurar Nginx como reverse proxy para acceder al dashboard de ROADMAP-KIT desde una URL publica.

---

## Escenario

```
Internet -> Nginx (puerto 80/443) -> Dashboard (puerto 3001)
```

Usuario accede a: `https://roadmap.tudominio.com`
Nginx redirige a: `http://localhost:3001`

---

## Requisitos

1. Servidor con Nginx instalado
2. Node.js 18+ instalado
3. (Opcional) Certificado SSL para HTTPS
4. (Opcional) Dominio configurado

---

## Paso 1: Iniciar el Dashboard

```bash
# En el servidor
cd /ruta/a/tu/proyecto/roadmap-kit/dashboard
npm install
npm run dev
```

O con PM2 para produccion:

```bash
pm2 start server.js --name roadmap-kit
```

Verifica que funciona:
```bash
curl http://localhost:3001
```

---

## Paso 2: Configurar Nginx

### Opcion A: Subdominio dedicado (Recomendado)

Crea `/etc/nginx/sites-available/roadmap`:

```nginx
server {
    listen 80;
    server_name roadmap.tudominio.com;

    # Redirigir HTTP a HTTPS (opcional, si tienes SSL)
    # return 301 https://$server_name$request_uri;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;

        # Headers para WebSocket (necesario para Vite HMR)
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';

        # Headers estandar
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

### Opcion B: Bajo una ruta de tu dominio

Si quieres acceder via `tudominio.com/roadmap`:

```nginx
server {
    listen 80;
    server_name tudominio.com;

    # Tu aplicacion principal
    location / {
        # ... tu configuracion existente
    }

    # ROADMAP-KIT Dashboard
    location /roadmap/ {
        rewrite ^/roadmap/(.*) /$1 break;
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## Paso 3: Habilitar el sitio

```bash
# Crear enlace simbolico
sudo ln -s /etc/nginx/sites-available/roadmap /etc/nginx/sites-enabled/

# Verificar configuracion
sudo nginx -t

# Recargar Nginx
sudo systemctl reload nginx
```

---

## Paso 4: Configurar SSL (Recomendado)

Con Certbot (Let's Encrypt):

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d roadmap.tudominio.com
```

Configuracion HTTPS resultante:

```nginx
server {
    listen 443 ssl http2;
    server_name roadmap.tudominio.com;

    ssl_certificate /etc/letsencrypt/live/roadmap.tudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/roadmap.tudominio.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name roadmap.tudominio.com;
    return 301 https://$server_name$request_uri;
}
```

---

## Paso 5: Habilitar Autenticacion

**IMPORTANTE:** Si expones el dashboard a Internet, DEBES habilitar autenticacion.

Edita `roadmap-kit/.env`:

```env
ROADMAP_AUTH_ENABLED=true
ROADMAP_USER=admin
ROADMAP_PASSWORD=contraseña_muy_segura_123!
```

Reinicia el dashboard:
```bash
pm2 restart roadmap-kit
```

---

## Seguridad Adicional

### Restringir acceso por IP

```nginx
location / {
    # Solo permitir IPs especificas
    allow 192.168.1.0/24;  # Red local
    allow 203.0.113.50;     # IP de tu oficina
    deny all;

    proxy_pass http://127.0.0.1:3001;
    # ... resto de configuracion
}
```

### Autenticacion basica de Nginx (capa adicional)

```bash
# Crear archivo de passwords
sudo apt install apache2-utils
sudo htpasswd -c /etc/nginx/.htpasswd usuario
```

```nginx
location / {
    auth_basic "Roadmap Dashboard";
    auth_basic_user_file /etc/nginx/.htpasswd;

    proxy_pass http://127.0.0.1:3001;
    # ... resto de configuracion
}
```

---

## Troubleshooting

### Error 502 Bad Gateway

- Verifica que el dashboard esta corriendo: `pm2 status`
- Verifica el puerto: `lsof -i:3001`

### Error 504 Gateway Timeout

- Aumenta los timeouts en Nginx
- Verifica que el servidor responde: `curl localhost:3001`

### WebSocket no funciona (HMR en desarrollo)

Asegurate de incluir los headers de Upgrade:
```nginx
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection 'upgrade';
```

### Cookies de sesion no funcionan

Verifica que X-Forwarded-Proto esta configurado:
```nginx
proxy_set_header X-Forwarded-Proto $scheme;
```

---

## Ejemplo Completo

```nginx
# /etc/nginx/sites-available/roadmap

upstream roadmap_backend {
    server 127.0.0.1:3001;
    keepalive 64;
}

server {
    listen 443 ssl http2;
    server_name roadmap.tudominio.com;

    ssl_certificate /etc/letsencrypt/live/roadmap.tudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/roadmap.tudominio.com/privkey.pem;

    # Seguridad
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logs
    access_log /var/log/nginx/roadmap_access.log;
    error_log /var/log/nginx/roadmap_error.log;

    location / {
        proxy_pass http://roadmap_backend;
        proxy_http_version 1.1;

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        proxy_cache_bypass $http_upgrade;
    }
}

server {
    listen 80;
    server_name roadmap.tudominio.com;
    return 301 https://$server_name$request_uri;
}
```
