#!/usr/bin/env python3
import subprocess
import sys
from datetime import datetime
import time

def get_timestamp():
    return datetime.now().strftime("[%Y-%m-%d %H:%M:%S]")

def run_cmd(cmd, quiet=False):
    if not quiet:
        print(f"{get_timestamp()} 🔄 {cmd}")
    result = subprocess.run(cmd, shell=True, capture_output=quiet)
    if result.returncode != 0:
        print(f"{get_timestamp()} ❌ Failed: {cmd}")
        if result.stderr:
            print(f"{get_timestamp()} ❌ Error: {result.stderr.decode()}")
        sys.exit(1)
    return result

def main():
    start_time = time.time()
    print(f"{get_timestamp()} 🚀 Deploying HomeSifu Landing Page...")

    # Create directory on server
    print(f"{get_timestamp()} 📁 Creating directory...")
    run_cmd("ssh -i config/homesifu-serverstatus_key.pem azureuser@52.230.106.42 'mkdir -p /home/azureuser/homesifu-landing'")

    # Upload files using rsync (optimized with progress and bandwidth limiting)
    print(f"{get_timestamp()} 📤 Uploading files with rsync...")
    run_cmd("rsync -az --delete --bwlimit=10000 --info=progress2 -e 'ssh -i config/homesifu-serverstatus_key.pem' src/ azureuser@52.230.106.42:/home/azureuser/homesifu-landing/")

    # Stop and remove existing container
    print(f"{get_timestamp()} 🔧 Stopping old container...")
    run_cmd("ssh -i config/homesifu-serverstatus_key.pem azureuser@52.230.106.42 'docker stop homesifu-website 2>/dev/null || true'", quiet=True)
    run_cmd("ssh -i config/homesifu-serverstatus_key.pem azureuser@52.230.106.42 'docker rm homesifu-website 2>/dev/null || true'", quiet=True)

    # Create simple nginx container with our files (internal access only - no external port)
    print(f"{get_timestamp()} 🔧 Creating new container...")
    run_cmd("ssh -i config/homesifu-serverstatus_key.pem azureuser@52.230.106.42 'docker run -d --name homesifu-website --restart unless-stopped nginx:alpine'")

    # Copy all files into container at once
    print(f"{get_timestamp()} 📁 Copying files into container...")
    run_cmd("ssh -i config/homesifu-serverstatus_key.pem azureuser@52.230.106.42 'docker cp /home/azureuser/homesifu-landing/. homesifu-website:/usr/share/nginx/html/'", quiet=True)

    # Copy custom nginx configuration
    print(f"{get_timestamp()} 🔧 Copying nginx configuration...")
    run_cmd("scp -i config/homesifu-serverstatus_key.pem docker/nginx.conf azureuser@52.230.106.42:/tmp/nginx.conf", quiet=True)
    run_cmd("ssh -i config/homesifu-serverstatus_key.pem azureuser@52.230.106.42 'docker cp /tmp/nginx.conf homesifu-website:/etc/nginx/nginx.conf'", quiet=True)

    # Reload nginx configuration to apply changes
    print(f"{get_timestamp()} 🔄 Reloading nginx configuration...")
    run_cmd("ssh -i config/homesifu-serverstatus_key.pem azureuser@52.230.106.42 'docker exec homesifu-website nginx -s reload'", quiet=True)

    # Check status
    print(f"{get_timestamp()} 📊 Checking container status...")
    status_result = run_cmd("ssh -i config/homesifu-serverstatus_key.pem azureuser@52.230.106.42 'docker ps | grep homesifu-website'", quiet=True)
    if status_result.stdout:
        print(f"{get_timestamp()} ✅ Container is running successfully")
    else:
        print(f"{get_timestamp()} ⚠️  Container status check failed")

    # Clean up temporary files on server
    print(f"{get_timestamp()} 🧹 Cleaning up temporary files...")
    run_cmd("ssh -i config/homesifu-serverstatus_key.pem azureuser@52.230.106.42 'rm -rf /home/azureuser/homesifu-landing'", quiet=True)

    # Calculate deployment duration
    end_time = time.time()
    duration = end_time - start_time

    print(f"{get_timestamp()} ✅ Done!")
    print(f"{get_timestamp()} 🌐 Your website is now live at:")
    print(f"{get_timestamp()}    - 🔒 HTTPS: https://landing.homesifu.io (SSL SECURED)")
    print(f"{get_timestamp()}    - ❌ Direct HTTP access removed for security")
    print(f"{get_timestamp()}    - 🛡️  All traffic now encrypted via Cloudflare SSL")
    print(f"{get_timestamp()} 📊 Deployment completed in {duration:.1f} seconds")

if __name__ == "__main__":
    main()