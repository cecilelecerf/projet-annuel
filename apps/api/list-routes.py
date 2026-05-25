# cd apps/api && python3 list-routes.py
import re
from pathlib import Path

def extract_routes(file_path: Path, base_prefix: str = "") -> list[tuple[str, str]]:
    content = file_path.read_text()
    routes = []

    # Trouve les imports
    import_map = {}
    for match in re.finditer(r'import\s+(\w+)\s+from\s+"([^"]+)"', content):
        import_map[match.group(1)] = match.group(2)

    # Trouve les sous-routers montés avec .use()
    for match in re.finditer(r'\w+\.use\(["\']([^"\']+)["\'],\s*(\w+)\)', content):
        prefix, router_var = match.group(1), match.group(2)
        if router_var in import_map:
            sub_path_full = file_path.parent / import_map[router_var].replace("./", "")
            candidates = [
                Path(str(sub_path_full) + ".ts"),
                sub_path_full.with_suffix(".ts"),
            ]
            if sub_path_full.parent.is_dir():
                stem = sub_path_full.name
                candidates += [
                    sub_path_full.parent / f"{stem}.router.ts",
                    sub_path_full.parent / f"{stem}.route.ts",
                ]
            sub_file = next((c for c in candidates if c.exists()), None)
            if sub_file:
                routes.extend(extract_routes(sub_file, base_prefix + prefix))

    # Trouve les routes directes
    for match in re.finditer(
        r'\w+\.(get|post|patch|put|delete)\(\s*["\']([^"\']+)["\']', content
    ):
        routes.append((match.group(1).upper(), base_prefix + match.group(2)))

    return routes


# Trouve les préfixes dans app.ts
app_content = Path("src/app.ts").read_text()

import_map_app = {}
for match in re.finditer(r'import\s+(\w+)\s+from\s+"([^"]+)"', app_content):
    import_map_app[match.group(1)] = match.group(2)
for match in re.finditer(r'import\s+\{\s*(\w+)\s*\}\s+from\s+"([^"]+)"', app_content):
    import_map_app[match.group(1)] = match.group(2)
for match in re.finditer(r'import\s+\{[^}]*\bas\s+(\w+)[^}]*\}\s+from\s+"([^"]+)"', app_content):
    import_map_app[match.group(1)] = match.group(2)

all_routes: list[tuple[str, str]] = []

# Routes directes sur app
for match in re.finditer(
    r'app\.(get|post|patch|put|delete)\(["\']([^"\']+)["\']', app_content
):
    all_routes.append((match.group(1).upper(), match.group(2)))

# Routers montés dans app.ts
for match in re.finditer(r'app\.use\(["\']([^"\']+)["\'],\s*(\w+)\)', app_content):
    prefix, router_var = match.group(1), match.group(2)
    if router_var not in import_map_app:
        continue

    relative = import_map_app[router_var].replace("./", "")
    candidates = [
        Path("src") / (relative + ".ts"),
        Path("src") / relative / "index.ts",
    ]
    folder = Path("src") / relative
    if folder.is_dir():
        candidates += list(folder.glob("*.router.ts")) + list(folder.glob("*.route.ts"))

    for candidate in candidates:
        if candidate.exists() and candidate.is_file():
            all_routes.extend(extract_routes(candidate, prefix))
            break

# Déduplique et trie
all_routes = list(set(all_routes))
all_routes.sort(key=lambda x: (x[1], x[0]))

colors = {
    "GET": "\033[32m",
    "POST": "\033[34m",
    "PATCH": "\033[33m",
    "PUT": "\033[33m",
    "DELETE": "\033[31m",
}
reset = "\033[0m"

print(f"\n{'─' * 55}")
print(f"  {len(all_routes)} routes exposées")
print(f"{'─' * 55}\n")

for method, path in all_routes:
    color = colors.get(method, "")
    print(f"  {color}{method:<7}{reset} {path}")

print(f"\n{'─' * 55}\n")