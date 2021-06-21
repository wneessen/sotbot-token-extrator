## Dockerfile for SoTBot-Token-Extrator
##
ARG         ALPINE_VERSION=3.13
FROM        alpine:$ALPINE_VERSION
LABEL       maintainer="wn@neessen.net"
RUN         apk add --no-cache npm nodejs
RUN         apk add --no-cache chromium
RUN         addgroup -S sotext
RUN         adduser -S -G sotext -g "SoTBot Extractor User" -s /bin/bash sotext
RUN         find / -perm +6000 -type f -print0 | xargs -0 chmod a-s || true
COPY        ["LICENSE", "README.md", "package.json", "package-lock.json", "/opt/sotext/"]
COPY        ["dist", "/opt/sotext/dist"]
RUN         chown -R sotext:sotext /opt/sotext
WORKDIR     /opt/sotext
USER        sotext
RUN         env PUPPETEER_SKIP_DOWNLOAD=true npm install
USER        root
USER        sotext
CMD         ["/usr/bin/node", "dist/sotbot-token-extrator.js"]
