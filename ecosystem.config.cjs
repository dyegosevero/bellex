module.exports = {
  apps: [
    {
      name: "bellex-api",
      script: "npx",
      args: "tsx api/index.ts",
      cwd: "/var/www/bellex",
      env_file: "/var/www/bellex/api/.env",
      watch: false,
      restart_delay: 3000,
      max_restarts: 10,
    },
  ],
};
