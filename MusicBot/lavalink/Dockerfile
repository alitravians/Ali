FROM ghcr.io/lavalink-devs/lavalink:4.2.2-alpine

# Lavalink listens on 2333 by default; the bot connects to it over fly.io's
# private 6PN network at music-lavalink-am.flycast:2333.

# Mount the config file at the location Lavalink expects.
COPY application.yml /opt/Lavalink/application.yml

# Plugins are downloaded automatically by Lavalink at startup based on the
# `lavalink.plugins` section of application.yml -- no manual fetch required.

EXPOSE 2333
