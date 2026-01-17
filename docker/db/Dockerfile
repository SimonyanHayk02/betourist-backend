FROM postgres:16-bookworm

# PostGIS for PostgreSQL 16 (native arm64 supported via base image)
RUN apt-get update \
    && apt-get install -y --no-install-recommends postgresql-16-postgis-3 postgresql-16-postgis-3-scripts \
    && rm -rf /var/lib/apt/lists/*


