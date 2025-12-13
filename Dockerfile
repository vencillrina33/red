FROM denoland/deno:latest
WORKDIR /app
COPY main.ts .
EXPOSE 8080
CMD ["deno", "run", "--allow-all", "main.ts"]
