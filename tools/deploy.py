#!/usr/bin/env python3
import subprocess
import sys

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
    run_cmd("ssh -i config/homesifu-serverstatus_key.pem azureuser@172.188.96.148 'mkdir -p /home/azureuser/homesifu-landing'")
    
    # Upload files using rsync (much faster)
    print("📤 Uploading files with rsync...")
    run_cmd("rsync -avz --delete -e 'ssh -i config/homesifu-serverstatus_key.pem' src/ azureuser@172.188.96.148:/home/azureuser/homesifu-landing/")
    
    # Stop and remove existing container
    print("🔧 Stopping old container...")
    run_cmd("ssh -i config/homesifu-serverstatus_key.pem azureuser@172.188.96.148 'docker stop homesifu-landing-page 2>/dev/null || true'")
    run_cmd("ssh -i config/homesifu-serverstatus_key.pem azureuser@172.188.96.148 'docker rm homesifu-landing-page 2>/dev/null || true'")
    
    # Create nginx container with port mapping (no custom nginx config needed)
    print("🔧 Creating new container with port 8081...")
    run_cmd("ssh -i config/homesifu-serverstatus_key.pem azureuser@172.188.96.148 'docker run -d --name homesifu-landing-page -p 8081:80 --restart unless-stopped nginx:alpine'")
    
    # Copy files into container
    print("📁 Copying files into container...")
    run_cmd("ssh -i config/homesifu-serverstatus_key.pem azureuser@172.188.96.148 'docker cp /home/azureuser/homesifu-landing/. homesifu-landing-page:/usr/share/nginx/html/'")
    
    # Check status
    print("📊 Checking container status...")
    run_cmd("ssh -i config/homesifu-serverstatus_key.pem azureuser@172.188.96.148 'docker ps | grep homesifu-landing-page'")
    
    # Clean up
    print("🧹 Cleaning up temporary files...")
    run_cmd("ssh -i config/homesifu-serverstatus_key.pem azureuser@172.188.96.148 'rm -rf /home/azureuser/homesifu-landing'")
    
    print("✅ Done!")
    print("🌐 Container is running on port 8081")
    print("🔧 System Nginx handles the domain routing")

if __name__ == "__main__":
    main()