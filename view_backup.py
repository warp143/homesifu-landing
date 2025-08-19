#!/usr/bin/env python3
"""
Simple HTTP server to view the HomeSifu backup
"""

import http.server
import socketserver
import os
from pathlib import Path

def serve_backup():
    """Serve the backup files locally"""
    backup_dir = Path("wix_backup")
    
    if not backup_dir.exists():
        print("Backup directory not found. Run scrape_homesifu.py first.")
        return
    
    # Change to backup directory
    os.chdir(backup_dir)
    
    PORT = 8080
    
    with socketserver.TCPServer(("", PORT), http.server.SimpleHTTPRequestHandler) as httpd:
        print(f"Backup server running at http://localhost:{PORT}")
        print(f"Navigate to http://localhost:{PORT}/navigation.html to see all files")
        print(f"Or go to http://localhost:{PORT}/index.html to view the main site")
        print("Press Ctrl+C to stop the server")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")

if __name__ == "__main__":
    serve_backup()
