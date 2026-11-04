# Validación técnica PPI

El 3 de noviembre de 2026, Cypress 16.1.1 ejecutó los ocho casos PPI contra Vite, Express y SQL Server. Resultado: **8 Pasa, 0 Falla, sin reintentos**.

- TC-GW02-02 y TC-GW09-01 completan módulos desde la interfaz. Comprueban el avance derivado y la persistencia tras recargar y consultar la API.
- TC-GW08-01 comprueba la precondición por módulos y descarga un PDF real. TC-GW08-02 conserva el rechazo del curso incompleto y la protección de rutas heredadas.
- El registro de módulos confirma la realización indicada por el estudiante. Calificaciones, evaluación docente y valoraciones numéricas requieren reglas académicas.

La ejecución original, su matriz y sus archivos multimedia se conservan en la entrega local. [Resumen de la ejecución](ppi-regresion-modulos.json).

## Reproducir la regresión

Coloca los repositorios en carpetas hermanas llamadas `frontend` y `backend`. Aplica la migración documentada en el backend e inicia la API en el puerto 4000 y Vite en el 5173. Desde frontend ejecuta `node cypress/helpers/run-ppi-modules.mjs` con `PPI_ADMIN_EMAIL` y `PPI_ADMIN_PASSWORD` en el entorno local. Usa una base de pruebas porque el script crea una cuenta sintética y dos cursos. Los resultados quedan en `reports/` cuando el checkout no contiene la matriz local.
