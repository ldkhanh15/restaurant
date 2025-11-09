# Flutter Builder - Multi-stage build for Android APK/AAB
FROM cirrusci/flutter:stable AS builder

WORKDIR /app

# Copy Flutter project
COPY user-app/restaurant_reservation_app/ ./restaurant_reservation_app/

WORKDIR /app/restaurant_reservation_app

# Get dependencies
RUN flutter pub get

# Build APK (debug)
RUN flutter build apk --debug --split-per-abi

# Build APK (release) - requires signing config
# RUN flutter build apk --release --split-per-abi

# Build AAB (release) - for Play Store
# RUN flutter build appbundle --release

# Export artifacts
FROM alpine:latest AS artifacts

WORKDIR /artifacts

# Copy built APKs
COPY --from=builder /app/restaurant_reservation_app/build/app/outputs/flutter-apk/*.apk ./

# Create artifact directory structure
RUN mkdir -p android/app/release && \
    mkdir -p android/app/debug && \
    mkdir -p ios/Release

# Note: iOS builds require macOS and Xcode, so they should be done via CI/CD
# or on a Mac machine with proper certificates and provisioning profiles

