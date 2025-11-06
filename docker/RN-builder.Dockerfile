# React Native / Expo Builder
# Note: Expo builds are typically done via EAS Build or GitHub Actions
# This Dockerfile is for bare React Native or custom Expo builds

FROM node:20-alpine AS base

WORKDIR /app

# Install dependencies for React Native
RUN apk add --no-cache \
    git \
    curl \
    bash

# For Android builds, we need Android SDK
# For production, consider using a dedicated Android build image
FROM base AS android-builder

# Install Android SDK (simplified - for production use official Android image)
RUN apk add --no-cache \
    openjdk17 \
    && rm -rf /var/cache/apk/*

# Copy React Native project
COPY admin-app/ ./admin-app/

WORKDIR /app/admin-app

# Install dependencies
RUN npm ci

# Build Android (requires proper setup)
# For Expo projects, use EAS Build instead:
# RUN npx expo build:android

# For bare React Native:
# RUN cd android && ./gradlew assembleRelease

# Export artifacts
FROM alpine:latest AS artifacts

WORKDIR /artifacts

# Create directories for Android and iOS artifacts
RUN mkdir -p android/app/release && \
    mkdir -p android/app/debug && \
    mkdir -p ios/Release && \
    mkdir -p ios/Debug

# Copy built artifacts (if any)
# COPY --from=android-builder /app/admin-app/android/app/build/outputs/apk/*.apk ./android/app/release/

# Note: 
# - Expo projects should use EAS Build (expo.dev) or GitHub Actions with expo/actions
# - iOS builds require macOS with Xcode
# - Android builds require proper keystore configuration

