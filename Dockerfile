# https://developers.home-assistant.io/docs/add-ons/configuration#add-on-dockerfile
ARG BUILD_FROM
FROM $BUILD_FROM

# Set shell
SHELL ["/bin/bash", "-o", "pipefail", "-c"]

# Install system dependencies and Node.js
ARG NODEJS_VERSION
RUN \
    apk add --no-cache \
        nodejs \
        npm \
        curl \
        && apk add --no-cache --virtual .build-dependencies \
        build-base \
        python3-dev \
        libffi-dev \
        openssl-dev \
        && pip3 install --no-cache-dir --upgrade pip

# Copy Python requirements and install
COPY requirements.txt /tmp/
RUN \
    pip3 install --no-cache-dir -r /tmp/requirements.txt \
    && apk del .build-dependencies \
    && rm -rf /tmp/*

# Copy and build frontend
COPY ui/ /tmp/ui/
RUN \
    cd /tmp/ui \
    && npm ci --only=production \
    && npm run build \
    && mkdir -p /app/static \
    && cp -r build/* /app/static/ \
    && rm -rf /tmp/ui

# Copy backend source
COPY app/ /app/

# Copy rootfs
COPY rootfs /

# Set working directory
WORKDIR /app

# Build arguments
ARG BUILD_ARCH
ARG BUILD_DATE
ARG BUILD_DESCRIPTION
ARG BUILD_NAME
ARG BUILD_REF
ARG BUILD_REPOSITORY
ARG BUILD_VERSION

# Labels
LABEL \
    io.hass.name="${BUILD_NAME}" \
    io.hass.description="${BUILD_DESCRIPTION}" \
    io.hass.arch="${BUILD_ARCH}" \
    io.hass.type="addon" \
    io.hass.version=${BUILD_VERSION} \
    maintainer="Richard Bankole <rick@richardbankole.com>" \
    org.opencontainers.image.title="${BUILD_NAME}" \
    org.opencontainers.image.description="${BUILD_DESCRIPTION}" \
    org.opencontainers.image.vendor="Home Assistant Community Add-ons" \
    org.opencontainers.image.authors="Richard Bankole <rick@richardbankole.com>" \
    org.opencontainers.image.licenses="MIT" \
    org.opencontainers.image.url="https://github.com/rickoslyder/ha-config-optimizer" \
    org.opencontainers.image.source="https://github.com/rickoslyder/ha-config-optimizer" \
    org.opencontainers.image.documentation="https://github.com/rickoslyder/ha-config-optimizer/blob/main/README.md" \
    org.opencontainers.image.created=${BUILD_DATE} \
    org.opencontainers.image.revision=${BUILD_REF} \
    org.opencontainers.image.version=${BUILD_VERSION}