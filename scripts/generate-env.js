#!/usr/bin/env node

/**
 * Script to generate .env files from .env.template files
 * Usage: node scripts/generate-env.js [service-name]
 *
 * If no service name is provided, generates .env for all services
 * Service names: backend, admin-web, user-web, chatbot, root
 */

const fs = require("fs");
const path = require("path");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const services = {
  backend: {
    template: "be_restaurant/env.template",
    output: "be_restaurant/.env",
    name: "Backend",
  },
  "admin-web": {
    template: "admin-web/env.template",
    output: "admin-web/.env.local",
    name: "Admin Web",
  },
  "user-web": {
    template: "user-web/env.template",
    output: "user-web/.env.local",
    name: "User Web",
  },
  chatbot: {
    template: "chatbot/env.template",
    output: "chatbot/.env",
    name: "Chatbot",
  },
  root: {
    template: "env.template",
    output: ".env",
    name: "Root (Docker Compose)",
  },
};

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

function readTemplate(templatePath) {
  try {
    return fs.readFileSync(templatePath, "utf8");
  } catch (error) {
    console.error(`❌ Error reading template: ${templatePath}`);
    console.error(error.message);
    process.exit(1);
  }
}

function parseTemplate(template) {
  const lines = template.split("\n");
  const variables = [];
  const comments = [];

  let currentComment = "";

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines
    if (!trimmed) {
      if (currentComment) {
        comments.push(currentComment);
        currentComment = "";
      }
      continue;
    }

    // Collect comments
    if (trimmed.startsWith("#")) {
      currentComment += line + "\n";
      continue;
    }

    // Parse variable
    if (trimmed.includes("=")) {
      const [key, ...valueParts] = trimmed.split("=");
      const value = valueParts.join("=");
      const keyTrimmed = key.trim();

      variables.push({
        key: keyTrimmed,
        defaultValue: value.trim(),
        comment: currentComment.trim() || null,
      });

      currentComment = "";
    }
  }

  return { variables, comments };
}

async function generateEnv(serviceConfig, isInteractive = false) {
  const { template, output, name } = serviceConfig;
  const templatePath = path.join(process.cwd(), template);
  const outputPath = path.join(process.cwd(), output);

  // Check if template exists
  if (!fs.existsSync(templatePath)) {
    console.error(`❌ Template not found: ${templatePath}`);
    return false;
  }

  // Check if .env already exists
  if (fs.existsSync(outputPath) && isInteractive) {
    const answer = await question(
      `⚠️  ${output} already exists. Overwrite? (y/N): `
    );
    if (answer.toLowerCase() !== "y") {
      console.log(`⏭️  Skipping ${name}`);
      return false;
    }
  }

  console.log(`\n📝 Generating ${name} environment file...`);
  console.log(`   Template: ${template}`);
  console.log(`   Output: ${output}`);

  const templateContent = readTemplate(templatePath);
  const { variables, comments } = parseTemplate(templateContent);

  let envContent = "";

  // Add header comment
  envContent += `# ${name} - Environment Variables\n`;
  envContent += `# Generated from ${template}\n`;
  envContent += `# Generated at: ${new Date().toISOString()}\n\n`;

  // Add section comments
  if (comments.length > 0) {
    envContent += comments.join("\n") + "\n";
  }

  // Process variables
  for (const variable of variables) {
    if (variable.comment) {
      envContent += `\n${variable.comment}\n`;
    }

    let value = variable.defaultValue;

    // Interactive mode: ask for values
    if (
      isInteractive &&
      !variable.defaultValue.includes("your-") &&
      !variable.defaultValue.includes("localhost")
    ) {
      const answer = await question(
        `   ${variable.key} [${variable.defaultValue}]: `
      );
      if (answer.trim()) {
        value = answer.trim();
      }
    }

    envContent += `${variable.key}=${value}\n`;
  }

  // Write file
  try {
    // Create directory if it doesn't exist
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, envContent, "utf8");
    console.log(`✅ Generated ${output} successfully!`);
    return true;
  } catch (error) {
    console.error(`❌ Error writing file: ${outputPath}`);
    console.error(error.message);
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const serviceName = args[0];
  const isInteractive = args.includes("--interactive") || args.includes("-i");

  console.log("🚀 Environment File Generator\n");

  if (serviceName) {
    // Generate for specific service
    if (!services[serviceName]) {
      console.error(`❌ Unknown service: ${serviceName}`);
      console.log(`Available services: ${Object.keys(services).join(", ")}`);
      process.exit(1);
    }

    await generateEnv(services[serviceName], isInteractive);
  } else {
    // Generate for all services
    console.log("Generating environment files for all services...\n");

    for (const [key, config] of Object.entries(services)) {
      await generateEnv(config, isInteractive);
    }

    console.log("\n✨ All environment files generated!");
  }

  rl.close();
}

main().catch((error) => {
  console.error("❌ Error:", error);
  rl.close();
  process.exit(1);
});
