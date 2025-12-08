FROM denoland/deno:1.40.0
WORKDIR /app
COPY main.ts .
EXPOSE 8080
USER deno
CMD ["run", "--allow-net", "main.ts"]
