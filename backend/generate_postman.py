import json
import subprocess
import sys

# Get routes from artisan
try:
    result = subprocess.run(['php', 'artisan', 'route:list', '--json'], capture_output=True, text=True, check=True)
    routes_json = result.stdout
except subprocess.CalledProcessError as e:
    print("Error running artisan command:", e)
    sys.exit(1)

try:
    routes = json.loads(routes_json)
except json.JSONDecodeError as e:
    print("Error decoding JSON:", e)
    # print first 100 chars to see what went wrong
    print(routes_json[:100])
    sys.exit(1)

collection = {
    "info": {
        "name": "CRM Travel API",
        "description": "Auto-generated Postman collection for CRM Travel project",
        "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
    },
    "item": [],
    "variable": [
        {
            "key": "base_url",
            "value": "http://127.0.0.1:8000",
            "type": "string"
        },
        {
            "key": "token",
            "value": "",
            "type": "string"
        }
    ]
}

folders = {}

for route in routes:
    uri = route.get('uri')
    method = route.get('method')
    
    if method == 'HEAD': 
        continue
    
    # Split method if multiple (e.g. GET|HEAD)
    methods = method.split('|')
    if 'GET' in methods:
        final_method = 'GET'
    elif 'POST' in methods:
        final_method = 'POST'
    elif 'PUT' in methods:
        final_method = 'PUT'
    elif 'DELETE' in methods:
        final_method = 'DELETE'
    else:
        final_method = methods[0]

    # Skip non-api routes (optional)
    if not uri.startswith('api/'):
        if uri not in ['google/connect', 'google/callback', 'sanctum/csrf-cookie', 'password/reset', 'password/email']:
             # check if it is one of our new password routes? 
             # wait, route:list showed them as api/password/email? No, typically they are just relative to root if not in group.
             # but we checked output, they are api/password/email
             pass

    # Determine folder name
    parts = uri.split('/')
    folder_name = "Root"
    if uri.startswith('api/'):
        if len(parts) > 1:
            folder_name = parts[1].capitalize()
            # Handle special cases like 'auth' or 'password'
            if folder_name == 'Requests': # unlikely
                 pass
    elif uri.startswith('sanctum'):
        folder_name = "Auth"
    elif uri.startswith('google'):
        folder_name = "Google"
    else:
        folder_name = "Other"

    if folder_name not in folders:
        folders[folder_name] = []

    # Build request item
    name = f"{final_method} {uri}"
    if route.get('name'):
        name = route.get('name')
    
    request_url = "{{base_url}}/" + uri

    item = {
        "name": uri, 
        "request": {
            "method": final_method,
            "header": [
                {
                    "key": "Accept",
                    "value": "application/json",
                    "type": "text"
                }
            ],
            "url": {
                "raw": request_url,
                "host": ["{{base_url}}"],
                "path": uri.split('/')
            }
        }
    }
    
    # Add Auth header if not public
    middleware = route.get('middleware', [])
    if 'auth:sanctum' in middleware or 'auth' in middleware or 'App\\Http\\Middleware\\Authenticate:sanctum' in middleware:
        item['request']['auth'] = {
            "type": "bearer",
            "bearer": [
                {
                    "key": "token",
                    "value": "{{token}}",
                    "type": "string"
                }
            ]
        }
    
    # Add body for POST/PUT
    if final_method in ['POST', 'PUT']:
        body_content = {}
        # Simple heuristic for common endpoints
        if 'login' in uri:
            body_content = {"email": "admin@travelops.com", "password": "password"}
        elif 'register' in uri:
             body_content = {"name": "", "email": "", "password": "", "password_confirmation": ""}
        elif 'password/email' in uri:
             body_content = {"email": ""}
        elif 'password/reset' in uri:
             body_content = {"token": "", "email": "", "password": "", "password_confirmation": ""}
             
        item['request']['body'] = {
            "mode": "raw",
            "raw": json.dumps(body_content, indent=4),
            "options": {
                "raw": {
                    "language": "json"
                }
            }
        }

    folders[folder_name].append(item)

# convert folders dict to list
for folder_name, items in folders.items():
    folder_item = {
        "name": folder_name,
        "item": items
    }
    collection["item"].append(folder_item)

# Sort folders
collection["item"].sort(key=lambda x: x["name"])

with open('crm_travel_postman_collection.json', 'w') as f:
    json.dump(collection, f, indent=4)

print("Collection generated successfully.")
