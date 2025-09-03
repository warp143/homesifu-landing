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
    
    # Upload files using rsync (much faster)
    print("📤 Uploading files with rsync...")
    run_cmd("rsync -avz --delete -e 'ssh -i config/homesifu-serverstatus_key.pem' src/ azureuser@52.230.106.42:/home/azureuser/homesifu-landing/")
    
    # Stop and remove existing container
    print("🔧 Stopping old container...")
    run_cmd("ssh -i config/homesifu-serverstatus_key.pem azureuser@52.230.106.42 'docker stop homesifu-website 2>/dev/null || true'")
    run_cmd("ssh -i config/homesifu-serverstatus_key.pem azureuser@52.230.106.42 'docker rm homesifu-website 2>/dev/null || true'")
    
    # Create simple nginx container with our files
    print("🔧 Creating new container...")
    run_cmd("ssh -i config/homesifu-serverstatus_key.pem azureuser@52.230.106.42 'docker run -d --name homesifu-website -p 8082:80 --restart unless-stopped nginx:alpine'")
    
    # Copy all files into container at once
    print("📁 Copying files into container...")
    run_cmd("ssh -i config/homesifu-serverstatus_key.pem azureuser@52.230.106.42 'docker cp /home/azureuser/homesifu-landing/. homesifu-website:/usr/share/nginx/html/'")
    
    # Check status
    print("📊 Checking container status...")
    run_cmd("ssh -i config/homesifu-serverstatus_key.pem azureuser@52.230.106.42 'docker ps | grep homesifu-website'")
    
    # Clean up temporary files on server
    print("🧹 Cleaning up temporary files...")
    run_cmd("ssh -i config/homesifu-serverstatus_key.pem azureuser@52.230.106.42 'rm -rf /home/azureuser/homesifu-landing'")
    
    print("✅ Done!")
    print("🌐 Your website is now live at:")
    print("   - HTTP: http://52.230.106.42:8082")
    print("   - HTTPS: https://landing.homesifu.io (configure in Nginx Proxy Manager)")

if __name__ == "__main__":
    main()