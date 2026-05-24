import { spawn } from "node:child_process";

function run(label, args) {
  const child = spawn("npm", args, { stdio: "inherit", shell: true });
  child.on("exit", (code) => {
    process.stdout.write(`${label} exited: ${code}\n`);
    process.exit(code ?? 0);
  });
  return child;
}

run("api", ["run", "api"]);
run("web", ["run", "dev", "--", "--host", "0.0.0.0"]);

