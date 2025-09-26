#!/usr/bin/env python3
import subprocess
import sys
from datetime import datetime

def get_timestamp():
    return datetime.now().strftime("[%Y-%m-%d %H:%M:%S]")

def run_cmd(cmd):
    print(f"{get_timestamp()} 🔄 {cmd}")
    result = subprocess.run(cmd, shell=True)
    if result.returncode != 0:
        print(f"{get_timestamp()} ❌ Failed: {cmd}")
        sys.exit(1)

def main():
    print(f"{get_timestamp()} 🚀 Deploying HomeSifu Landing Page...")

    # Create directory on server
    print(f"{get_timestamp()} 📁 Creating directory...")
    run_cmd("ssh -i config/homesifu-serverstatus_key.pem azureuser@52.230.106.42 'mkdir -p /home/azureuser/homesifu-landing'")

    # Upload files using rsync (optimized with progress and bandwidth limiting)
    print(f"{get_timestamp()} 📤 Uploading files with rsync...")
    run_cmd("rsync -azP --delete --bwlimit=10000 -e 'ssh -i config/homesifu-serverstatus_key.pem' src/ azureuser@52.230.106.42:/home/azureuser/homesifu-landing/")

    # Stop and remove existing container
    print(f"{get_timestamp()} 🔧 Stopping old container...")
    run_cmd("ssh -i config/homesifu-serverstatus_key.pem azureuser@52.230.106.42 'docker stop homesifu-website 2>/dev/null || true'")
    run_cmd("ssh -i config/homesifu-serverstatus_key.pem azureuser@52.230.106.42 'docker rm homesifu-website 2>/dev/null || true'")

    # Create simple nginx container with our files (internal access only - no external port)
    print(f"{get_timestamp()} 🔧 Creating new container...")
    run_cmd("ssh -i config/homesifu-serverstatus_key.pem azureuser@52.230.106.42 'docker run -d --name homesifu-website --restart unless-stopped nginx:alpine'")

    # Copy all files into container at once
    print(f"{get_timestamp()} 📁 Copying files into container...")
    run_cmd("ssh -i config/homesifu-serverstatus_key.pem azureuser@52.230.106.42 'docker cp /home/azureuser/homesifu-landing/. homesifu-website:/usr/share/nginx/html/'")

    # Copy custom nginx configuration
    print(f"{get_timestamp()} 🔧 Copying nginx configuration...")
    run_cmd("scp -i config/homesifu-serverstatus_key.pem docker/nginx.conf azureuser@52.230.106.42:/tmp/nginx.conf")
    run_cmd("ssh -i config/homesifu-serverstatus_key.pem azureuser@52.230.106.42 'docker cp /tmp/nginx.conf homesifu-website:/etc/nginx/nginx.conf'")

    # Reload nginx configuration to apply changes
    print(f"{get_timestamp()} 🔄 Reloading nginx configuration...")
    run_cmd("ssh -i config/homesifu-serverstatus_key.pem azureuser@52.230.106.42 'docker exec homesifu-website nginx -s reload'")

    # Check status
    print(f"{get_timestamp()} 📊 Checking container status...")
    run_cmd("ssh -i config/homesifu-serverstatus_key.pem azureuser@52.230.106.42 'docker ps | grep homesifu-website'")

    # Clean up temporary files on server
    print(f"{get_timestamp()} 🧹 Cleaning up temporary files...")
    run_cmd("ssh -i config/homesifu-serverstatus_key.pem azureuser@52.230.106.42 'rm -rf /home/azureuser/homesifu-landing'")

    print(f"{get_timestamp()} ✅ Done!")
    print(f"{get_timestamp()} 🌐 Your website is now live at:")
    print(f"{get_timestamp()}    - 🔒 HTTPS: https://landing.homesifu.io (SSL SECURED)")
    print(f"{get_timestamp()}    - ❌ Direct HTTP access removed for security")
    print(f"{get_timestamp()}    - 🛡️  All traffic now encrypted via Cloudflare SSL")

if __name__ == "__main__":
    main()