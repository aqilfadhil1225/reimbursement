FROM golang:1.24-alpine AS build

RUN go install -trimpath -ldflags="-s -w" github.com/minio/minio@7aac2a2c5b7c882e68c1ce017d8256be2feea27f

FROM alpine:3.22

RUN apk add --no-cache ca-certificates \
    && addgroup -S minio \
    && adduser -S -G minio -u 10001 -h /home/minio minio \
    && mkdir -p /data /home/minio \
    && chown -R minio:minio /data /home/minio

COPY --from=build /go/bin/minio /usr/local/bin/minio

ENV HOME=/home/minio
USER minio
VOLUME ["/data"]
EXPOSE 9000 9001
ENTRYPOINT ["minio"]
CMD ["server", "/data", "--console-address", ":9001"]
