import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const INDIR = path.resolve(__dirname, "./prisma/generated/zod/modelSchema");
const INPUTDIR = path.resolve(
	__dirname,
	"./prisma/generated/zod/inputTypeSchemas"
);
const OUTDIR = path.resolve(__dirname, "./prisma/zod/models");
const INPUT_OUTDIR = path.resolve(__dirname, "./prisma/zod/input-schemas");
const CLEANDIR = path.resolve(__dirname, "./prisma/generated");

fs.mkdirSync(OUTDIR, { recursive: true });
fs.mkdirSync(INPUT_OUTDIR, { recursive: true });

console.log("📦 Scanning model files for used input type schemas...");

// Get all .ts files in modelSchema directory
const modelFiles = fs.readdirSync(INDIR).filter((f) => f.endsWith(".ts"));

const importSet = new Set();

for (const file of modelFiles) {
	const content = fs.readFileSync(path.join(INDIR, file), "utf8");
	const matches = content.matchAll(
		/from\s+['"]..\/inputTypeSchemas\/([^'"]+)['"]/g
	);
	for (const match of matches) {
		importSet.add(match[1].replace(/["']/g, ""));
	}
}

console.log("🔍 Found input schemas:");
console.log([...importSet].join("\n"));

// Copy the required input schemas
for (const schema of importSet) {
	const src = path.join(INPUTDIR, `${schema}.ts`);
	const dest = path.join(INPUT_OUTDIR, `${schema}.js`);

	if (fs.existsSync(src)) {
		console.log(`➕ Copying ${schema} → input-schemas`);

		const input = fs.readFileSync(src, "utf8");
		const transformed = input
			.split("\n")
			.filter(
				(line) =>
					!line.startsWith("import type ") &&
					!line.startsWith("export type ")
			)
			.map((line) => line.replace(/(:\s*[^=]+)\s*=\s*/g, " = "))
			.join("\n");

		fs.writeFileSync(dest, transformed);
	} else {
		console.warn(`⚠️ Warning: ${schema}.ts not found`);
	}
}

// Convert model schema files
console.log("⚙️ Converting model schema files and updating import paths...");

for (const file of modelFiles) {
	const srcPath = path.join(INDIR, file);
	const destPath = path.join(OUTDIR, file.replace(/\.ts$/, ".js"));

	const content = fs.readFileSync(srcPath, "utf8");
	const transformed = content
		.split("\n")
		.filter(
			(line) =>
				!line.startsWith("import type ") &&
				!line.startsWith("export type ")
		)
		.map((line) =>
			line
				.replace(/\.\.\/inputTypeSchemas\//g, "../input-schemas/")
				.replace(/(:\s*[^=]+)\s*=\s*/g, " = ")
		)
		.join("\n");

	fs.writeFileSync(destPath, transformed);
	console.log(`✔ Converted: ${file} → ${path.basename(destPath)}`);
}

// Clean up the generated directory
console.log("Cleaning Generated dir");
fs.rmSync(CLEANDIR, { recursive: true, force: true });

console.log("✅ Done. Output written to:");
console.log(`- ${OUTDIR} (model schemas)`);
console.log(`- ${INPUT_OUTDIR} (used input schemas)`);
