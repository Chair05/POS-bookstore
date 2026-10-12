# Build both frontends, then serve them from nginx and proxy /api to the API.
#
#   docker build -t lccb-api ./backend
#   docker build -t lccb-web -f deploy/Dockerfile .
#
# The two frontends are separate Vite apps and must be built separately; this
# image builds both and serves them under different hostnames/paths.

# ---------- stage 1: build the POS app ----------
FROM node:22-alpine AS pos-build
WORKDIR /build
COPY frontend/package.json frontend/package-lock.json ./frontend/
RUN cd frontend && npm ci
COPY frontend ./frontend
# Serve the POS from /pos/ (see deploy/nginx.conf); the bundle must be built
# with a matching base or it will request the storefront's assets.
RUN cd frontend && VITE_BASE=/pos/ npm run build

# ---------- stage 2: build the storefront ----------
FROM node:22-alpine AS shop-build
WORKDIR /build
COPY Ecommerce_Bookstore/package.json Ecommerce_Bookstore/package-lock.json ./Ecommerce_Bookstore/
RUN cd Ecommerce_Bookstore && npm ci
COPY Ecommerce_Bookstore ./Ecommerce_Bookstore
RUN cd Ecommerce_Bookstore && npm run build

# ---------- stage 3: serve ----------
FROM nginx:1.27-alpine AS runtime

COPY --from=pos-build  /build/frontend/dist           /usr/share/nginx/html/pos
COPY --from=shop-build /build/Ecommerce_Bookstore/dist /usr/share/nginx/html/shop
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
