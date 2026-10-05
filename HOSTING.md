# Recuperación del hosting gratuito

## Causa y solución

El 5 de octubre de 2026, GitHub Pages respondía correctamente, pero la API de Railway devolvía `404 Application not found`. El dominio estaba configurado; los despliegues de API y MySQL estaban retirados y la cuenta tenía una suscripción inactiva tras vencer el trial.

Se activó **Railway Free**, sin contratar un plan pago. Se conservó el servicio MySQL y su volumen original. La URL de la API continúa siendo:

`https://hartseer-analytics-production.up.railway.app/api/v1`

## Ajustes de Railway

- Plan: Free, con US$1 de crédito mensual y 512 MB de memoria por servicio.
- API y MySQL: suspensión automática cuando no hay actividad.
- MySQL: se redujo el buffer de InnoDB de 1 GB a 64 MB para respetar la memoria disponible. El volumen sigue montado en `/var/lib/mysql`.
- API: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`, con `PORT=8080`, que coincide con el puerto del dominio.
- API: health check en `/api/v1/health`, con 60 segundos de tolerancia al arranque.
- Conexiones a la base por red privada; se conservaron las variables de acceso existentes.

Variables adicionales de la API:

```text
DB_USE_POOL=false
DB_CONNECT_TIMEOUT=10
DB_CONNECT_RETRIES=3
DB_CONNECT_RETRY_DELAY=1
PORT=8080
```

`DB_USE_POOL=false` abre y cierra conexiones físicas por solicitud para evitar que sockets persistentes impidan la suspensión. El modo de pool continúa disponible y habilitado por defecto en entornos que no necesiten suspensión.

## Comportamiento del sitio

La API inicia sin conectarse inmediatamente a MySQL. Si la base está despertando, realiza reintentos limitados; si sigue inaccesible, devuelve un error 503 sin exponer credenciales.

El frontend muestra el estado de carga y, ante un error persistente, un aviso con botón **Reintentar**. Reintenta fallos de red y respuestas 502/503/504 hasta tres veces, con un límite total de 60 segundos por solicitud. Se conservan la deduplicación de solicitudes y la protección contra respuestas antiguas.

No se usan datos inventados ni se sustituye la API por archivos estáticos. Se mantienen los dashboards, filtros, agrupaciones y comparaciones con la base MySQL.

## Límites del servicio gratuito

Free no garantiza disponibilidad continua con cualquier volumen de tráfico. Los arranques tras inactividad pueden tardar unos segundos y, si se agota el crédito mensual, Railway puede suspender los servicios. La suspensión y las conexiones de corta duración reducen consumo; no garantizan que cualquier uso entre en el crédito gratuito.

Referencias: [planes](https://docs.railway.com/pricing/plans), [Serverless](https://docs.railway.com/deployments/serverless).

## Verificación local

```powershell
node frontend/tests/regressions.cjs
backend/.venv/Scripts/python.exe backend/tests/test_regressions.py
```

25 pruebas del backend y 19 del frontend cubren también arranque sin base, reintentos, cierre de conexiones, errores 503, timeout y recuperación mediante el botón Reintentar.
