# Portada renovada — Conecta Bancaribe V4.11.3 Docker Linux POC

Se incorporó la portada corregida dentro de `components/LoginDemo.tsx` mediante una imagen WebP embebida como data URI, para que no dependa de una ruta de recursos estáticos. Se añadieron estilos visuales en `app/globals.css`.

No se modificaron rutas API, autenticación Demo, roles, permisos, base de datos, Dockerfile ni compose.yaml.

## Instalación

Desde el directorio que contiene `compose.yaml`:

```bash
docker compose build --no-cache
docker compose up -d
docker compose logs -f
```

Abrir la URL configurada y actualizar la caché del navegador (Ctrl+F5). Validar el login y el panel izquierdo en pantallas de escritorio y móvil.

**Estado:** paquete preparado e inspeccionado estáticamente. No se ejecutó una compilación Docker ni prueba visual en Linux. No apto para producción.
