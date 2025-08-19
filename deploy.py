#!/usr/bin/env python3
import subprocess
import sys
import os

def run_cmd(cmd):
    print(f"🔄 {cmd}")
    result = subprocess.run(cmd, shell=True)
    if result.returncode != 0:
        print(f"❌ Failed: {cmd}")
        sys.exit(1)

def main():
    print("🚀 Deploying HomeSifu Landing Page...")
    
    # Create directory on server
    print("📁 Creating directory...")
    run_cmd("ssh -i config/homesifu-serverstatus_key.pem azureuser@52.230.106.42 'mkdir -p /home/azureuser/homesifu-landing'")
    
    # Upload only the files we need
    print("📤 Uploading files...")
    files = ["index.html", "script.js", "styles.css", "images"]
    for file in files:
        if os.path.exists(file):
            run_cmd(f"scp -i config/homesifu-serverstatus_key.pem -r {file} azureuser@52.230.106.42:/home/azureuser/homesifu-landing/")
    
    # Stop and remove existing container
    print("🔧 Stopping old container...")
    run_cmd("ssh -i config/homesifu-serverstatus_key.pem azureuser@52.230.106.42 'docker stop homesifu-website 2>/dev/null || true'")
    run_cmd("ssh -i config/homesifu-serverstatus_key.pem azureuser@52.230.106.42 'docker rm homesifu-website 2>/dev/null || true'")
    
    # Create simple nginx container with our files
    print("🔧 Creating new container...")
    run_cmd("ssh -i config/homesifu-serverstatus_key.pem azureuser@52.230.106.42 'docker run -d --name homesifu-website -p 8082:80 --restart unless-stopped nginx:alpine'")
    
    # Copy files into container
    print("📁 Copying files into container...")
    run_cmd("ssh -i config/homesifu-serverstatus_key.pem azureuser@52.230.106.42 'docker cp /home/azureuser/homesifu-landing/index.html homesifu-website:/usr/share/nginx/html/'")
    run_cmd("ssh -i config/homesifu-serverstatus_key.pem azureuser@52.230.106.42 'docker cp /home/azureuser/homesifu-landing/script.js homesifu-website:/usr/share/nginx/html/'")
    run_cmd("ssh -i config/homesifu-serverstatus_key.pem azureuser@52.230.106.42 'docker cp /home/azureuser/homesifu-landing/styles.css homesifu-website:/usr/share/nginx/html/'")
    run_cmd("ssh -i config/homesifu-serverstatus_key.pem azureuser@52.230.106.42 'docker cp /home/azureuser/homesifu-landing/images homesifu-website:/usr/share/nginx/html/'")
    
    # Check status
    print("📊 Checking container status...")
    run_cmd("ssh -i config/homesifu-serverstatus_key.pem azureuser@52.230.106.42 'docker ps | grep homesifu-website'")
    
    print("✅ Done!")
    print("🌐 Your website is now live at:")
    print("   - HTTP: http://52.230.106.42:8082")
    print("   - HTTPS: https://landing.homesifu.io (configure in Nginx Proxy Manager)")

if __name__ == "__main__":
    main()