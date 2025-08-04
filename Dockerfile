# syntax = docker/dockerfile:1

# Используем Node.js 20.18.0 slim для уменьшения размера
ARG NODE_VERSION=20.18.0
FROM node:${NODE_VERSION}-slim AS base

LABEL fly_launch_runtime="Node.js"

# Устанавливаем рабочую директорию
WORKDIR /app

# Устанавливаем production-режим
ENV NODE_ENV="production"

# Этап сборки
FROM base AS build

# Устанавливаем необходимые пакеты
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y python3 build-essential && \
    rm -rf /var/lib/apt/lists/*

# Копируем package.json и package-lock.json
COPY package.json package-lock.json* ./
RUN npm ci --production

# Копируем код приложения
COPY . .

# Финальный этап
FROM base

# Копируем собранное приложение
COPY --from=build /app /app

# Открываем порт
EXPOSE 3000

# Запускаем приложение
CMD ["node", "server.js"]
